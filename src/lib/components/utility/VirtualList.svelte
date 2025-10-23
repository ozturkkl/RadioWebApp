<script lang="ts">
	import { onMount } from 'svelte';

	// Minimal windowed list for small screens using top/bottom spacers.
	// - Removes offscreen DOM above and below
	// - Keeps scrollbar stable via spacers and estimated item height
	// - Dynamically refines heights via a shared ResizeObserver

	export let items: unknown[] = [];
	export let estimatedItemHeight = 200; // px
	export let overscanPx = 200;
	export let debug = false;

	let hostEl: HTMLDivElement | null = null; // display: contents wrapper
	let parentEl: HTMLElement | null = null; // grid container
	let scrollRoot: Element | Window = window;

	let rowGapPx = 0;
	let columns = 1;
	let rowHeights: number[] = [];
	let rowOffsets: number[] = [];
	let viewportHeight = 0;
	let scrollTop = 0;
	let listOffsetTop = 0;

	let heights: number[] = [];
	let totalHeight = 0;
	let startIndex = 0;
	let endIndex = 0;
	let startRow = 0;
	let endRow = 0;

	let ro: ResizeObserver | null = null;

	let topSpacer = 0;
	let bottomSpacer = 0;

	function getScrollParent(node: HTMLElement | null) {
		let parent: HTMLElement | null = node?.parentElement || null;
		const overflowRe = /(auto|scroll)/;
		while (parent) {
			const style = getComputedStyle(parent);
			if (overflowRe.test(style.overflowY)) return parent;
			parent = parent.parentElement;
		}
		return null;
	}

	function initHeights() {
		const len = items.length;
		const oldLen = heights.length;
		if (oldLen !== len) {
			const newHeights = Array(len).fill(estimatedItemHeight);
			for (let i = 0; i < Math.min(oldLen, len); i++) newHeights[i] = heights[i];
			heights = newHeights;
			recomputeAllOffsets(len);
		}
	}

	function computeViewport() {
		const localTop = scrollTop - listOffsetTop;
		const top = Math.max(0, localTop - overscanPx);
		const bottom = Math.min(totalHeight, Math.max(0, localTop + viewportHeight + overscanPx));
		const cols = Math.max(1, columns);
		startRow = Math.min(rowOffsets.length - 1, binarySearchRowOffset(top));
		endRow = Math.min(rowOffsets.length - 1, binarySearchRowOffset(bottom) + 1);
		const rowCount = Math.ceil(items.length / cols);
		if (endRow <= startRow && rowCount > 0) endRow = Math.min(rowCount, startRow + 1);
		startIndex = Math.min(items.length, startRow * cols);
		endIndex = Math.min(items.length, endRow * cols);
	}

	function measureRowGap() {
		if (!parentEl) return;
		const s = getComputedStyle(parentEl);
		const v = s.rowGap || s.gap;
		const parsed = v ? parseFloat(v) : 0;
		rowGapPx = Number.isFinite(parsed) ? parsed : 0;
		logState('measureRowGap', { rowGapPx });

		recomputeAllOffsets();
	}

	function measureColumns() {
		if (!parentEl) return;
		const s = getComputedStyle(parentEl);
		const tpl = s.gridTemplateColumns;
		if (!tpl || tpl === 'none') {
			columns = 1;
		} else {
			const count = tpl.trim().split(/\s+/).filter(Boolean).length;
			columns = Math.max(1, count);
		}
		logState('measureColumns', { columns });

		recomputeAllOffsets();
	}

	function readScrollState() {
		if (scrollRoot === window) {
			scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
			viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
		} else {
			const el = scrollRoot as Element;
			scrollTop = el.scrollTop;
			viewportHeight = el.clientHeight;
		}
	}

	let pending = false;
	function scheduleUpdate() {
		if (pending) return;
		pending = true;
		requestAnimationFrame(() => {
			pending = false;
			listOffsetTop = computeListOffsetTop();
			readScrollState();
			computeViewport();
			recomputeSpacers();
			logState('raf');
		});
	}

	function recomputeSpacers() {
		topSpacer = rowOffsets[startRow] || 0;
		bottomSpacer = totalHeight - (rowOffsets[endRow] || 0);
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			parentEl = hostEl?.parentElement || null;
			scrollRoot = getScrollParent(parentEl) || window;
			logState('onMount', { parentEl, scrollRoot });
			measureRowGap();
			measureColumns();
			initHeights();

			const onScroll = () => scheduleUpdate();
			const onResize = () => {
				measureRowGap();
				measureColumns();
				scheduleUpdate();
			};
			const scrollTarget = scrollRoot === window ? window : (scrollRoot as Element);
			scrollTarget.addEventListener('scroll', onScroll, { passive: true });
			window.addEventListener('resize', onResize);

			ro = new ResizeObserver((entries) => {
				for (const entry of entries) {
					logState('resize observer', entry);
					const el = entry.target as HTMLElement;
					const idxStr = el.dataset.index;
					if (!idxStr) continue;
					const idx = Number(idxStr);
					const h = entry.contentRect.height;
					if (h > 0 && Math.abs(h - heights[idx]) > 0.5) {
						heights[idx] = h;
						recomputeAllOffsets();
						scheduleUpdate();
						logState('resize', { idx, h, totalHeight });
					}
				}
			});

			return () => {
				const scrollTarget = scrollRoot === window ? window : (scrollRoot as Element);
				(scrollTarget as Window | Element).removeEventListener('scroll', onScroll as EventListener);
				window.removeEventListener('resize', onResize);
				ro?.disconnect();
			};
		}
	});

	$: ((_len, _estimate) => {
		initHeights();
		scheduleUpdate();
	})(items.length, estimatedItemHeight);

	function observeRowAction(node: HTMLElement, index: number) {
		if (typeof index === 'number') {
			node.dataset.index = String(index);
		}
		queueMicrotask(() => {
			if (!ro || !node.isConnected) return;
			ro.observe(node);
		});
		return {
			update(newIndex: number) {
				node.dataset.index = String(newIndex);
			},
			destroy() {
				ro?.unobserve(node);
			}
		};
	}

	function recomputeAllOffsets(len = items.length) {
		const cols = Math.max(1, columns | 0);
		const rowCount = cols === 1 ? len : Math.ceil(len / cols);
		rowHeights = new Array(rowCount).fill(0);
		if (cols === 1) {
			for (let i = 0; i < len; i++) rowHeights[i] = heights[i];
		} else {
			for (let i = 0; i < len; i++) {
				const r = Math.floor(i / cols);
				if (heights[i] > rowHeights[r]) rowHeights[r] = heights[i];
			}
		}
		rowOffsets = new Array(rowCount + 1);
		rowOffsets[0] = 0;
		for (let r = 0; r < rowCount; r++) {
			const gap = r < rowCount - 1 ? rowGapPx : 0;
			rowOffsets[r + 1] = rowOffsets[r] + rowHeights[r] + gap;
		}
		totalHeight = rowOffsets[rowCount];
	}

	function binarySearchRowOffset(target: number) {
		// returns largest r such that rowOffsets[r] <= target
		let lo = 0;
		let hi = rowOffsets.length - 1;
		while (lo < hi) {
			const mid = Math.floor((lo + hi + 1) / 2);
			if (rowOffsets[mid] <= target) lo = mid;
			else hi = mid - 1;
		}
		return lo;
	}

	function computeListOffsetTop() {
		if (!parentEl) return 0;
		if (scrollRoot === window) {
			const rect = parentEl.getBoundingClientRect();
			const docEl = document.documentElement;
			return rect.top + (window.scrollY || docEl.scrollTop || 0);
		} else {
			const rootEl = scrollRoot as Element;
			const listRect = parentEl.getBoundingClientRect();
			const rootRect = rootEl.getBoundingClientRect();
			return listRect.top - rootRect.top + rootEl.scrollTop;
		}
	}

	function logState(tag: string, ...args: unknown[]) {
		if (!debug) return;
		console.log(
			'[VirtualList]',
			tag,
			{
				items: items.length,
				startIndex,
				endIndex,
				topSpacer,
				bottomSpacer,
				totalHeight,
				rowGapPx,
				viewportHeight,
				scrollTop,
				listOffsetTop
			},
			...args
		);
	}
</script>

<div bind:this={hostEl} style="display: contents">
	{#if items.length === 0}
		<!-- nothing -->
	{:else}
		{#each Array(columns) as _}
			<!-- have multiple spacers so we don't have weird spacing issues with the grid layout  -->
			<div style="height: {topSpacer}px"></div>
		{/each}
		{#each items.slice(startIndex, endIndex) as item, i (startIndex + i)}
			<div style="width: 100%" use:observeRowAction={startIndex + i}>
				<slot {item} index={startIndex + i} />
			</div>
		{/each}
		{#each Array(columns) as _}
			<!-- have multiple spacers so we don't have weird spacing issues with the grid layout  -->
			<div style="height: {bottomSpacer}px"></div>
		{/each}
	{/if}
</div>
