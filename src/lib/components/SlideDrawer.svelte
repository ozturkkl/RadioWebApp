<script lang="ts">
	import { spring } from 'svelte/motion';
	import { onMount, tick } from 'svelte';
	import { get } from 'svelte/store';

	let containerEl: HTMLElement | null = null;
	let miniEl: HTMLElement | null = null;
	let resizeObserver: ResizeObserver | undefined;
	let expandedPercentage = 0;

	$: {
		expandedPercentage = 100 - Math.min(Math.max($y / maxY, 0), 1) * 100;
	}

	function getCollapsedHeight() {
		if (miniEl) {
			return miniEl.offsetHeight;
		}
		return 200; // sensible default
	}

	let collapsedHeight: number = 0;

	const VELOCITY_THRESHOLD = 0.2; // px/ms – quick flicks
	const MOVEMENT_WINDOW = 120; // ms

	let viewportHeight = 0;
	let maxY = 0; // distance the drawer can travel (collapsed pos)
	const y = spring(0, { stiffness: 0.08, damping: 0.3 });
	let isExpanded = false;

	function updatePositions() {
		viewportHeight = window.innerHeight;
		collapsedHeight = getCollapsedHeight();

		maxY = viewportHeight - collapsedHeight;
		if (!isExpanded) {
			y.set(maxY, { hard: true });
		}
	}

	onMount(() => {
		const init = async () => {
			await tick();

			if (containerEl) {
				miniEl = containerEl.querySelector('[data-slide-drawer-mini]') as HTMLElement | null;
				if (!miniEl) {
					miniEl = containerEl.firstElementChild as HTMLElement | null;
				}

				if (miniEl) {
					resizeObserver = new ResizeObserver(() => {
						updatePositions();
					});
					resizeObserver.observe(miniEl);
				}
			}

			updatePositions();
		};

		init();

		window.addEventListener('resize', updatePositions);

		return () => {
			window.removeEventListener('resize', updatePositions);
			resizeObserver?.disconnect();
		};
	});

	// --- public helpers ---
	export function expand() {
		y.set(0);
		isExpanded = true;
	}
	export function collapse() {
		y.set(maxY);
		isExpanded = false;
	}

	// --- drag handling ---
	let dragElement: HTMLElement | null = null;
	let activePointerIds: number[] = [];
	let dragStartY = 0;
	let dragStartValue = 0;
	let trail: { y: number; time: number }[] = [];

	function onPointerDown(event: PointerEvent | TouchEvent) {
		const clientY = 'clientY' in event ? event.clientY : event.changedTouches[0].clientY;
		const pointerId = 'pointerId' in event ? event.pointerId : event.changedTouches[0].identifier;
		dragStartY = clientY;
		dragStartValue = get(y);
		trail = [];
		activePointerIds.push(pointerId);
	}

	function onPointerMove(event: PointerEvent | TouchEvent) {
		const clientY = 'clientY' in event ? event.clientY : event.changedTouches[0].clientY;
		const pointerId = 'pointerId' in event ? event.pointerId : event.changedTouches[0].identifier;
		if (!activePointerIds.includes(pointerId)) return;

		const deltaTotal = clientY - dragStartY;
		dragElement = event.currentTarget as HTMLElement;
		dragElement?.setPointerCapture?.(pointerId);

		let newY = dragStartValue + deltaTotal;
		newY = Math.min(Math.max(newY, 0), maxY);
		y.set(newY, { hard: true });

		// record trail sample
		const now = performance.now();
		trail.push({ y: clientY, time: now });
		while (trail.length && now - trail[0].time > MOVEMENT_WINDOW) {
			trail.shift();
		}
	}

	function endDrag() {
		activePointerIds.forEach((id) => dragElement?.releasePointerCapture?.(id));
		activePointerIds = [];
	}

	function onPointerUp(event: PointerEvent | TouchEvent) {
		const clientY = 'clientY' in event ? event.clientY : event.changedTouches[0].clientY;
		const currentTime = performance.now();
		trail.push({ y: clientY, time: currentTime });
		while (trail.length && currentTime - trail[0].time > MOVEMENT_WINDOW) {
			trail.shift();
		}
		const first = trail[0];
		const last = trail[trail.length - 1];
		const delta = last.y - first.y;
		const duration = Math.max(1, last.time - first.time);
		const velocity = Math.abs(delta) / duration;

		const currentY = get(y);

		if (velocity > VELOCITY_THRESHOLD) {
			delta < 0 ? expand() : collapse();
		} else {
			currentY > maxY / 2 ? collapse() : expand();
		}
		endDrag();
	}

	function onPointerCancel(event: PointerEvent | TouchEvent) {
		const pointerId = 'pointerId' in event ? event.pointerId : event.changedTouches[0].identifier;
		activePointerIds = activePointerIds.filter((id) => id !== pointerId);
	}
</script>

<!-- Reserve space so page content isn't hidden behind the fixed drawer -->
<div style="height: {collapsedHeight}px;"></div>

<!-- Sliding drawer container -->
<div
	bind:this={containerEl}
	class="pointer-events-auto fixed left-0 right-0 top-0 z-50 flex h-dvh w-screen flex-col"
	style="transform: translateY({$y}px); touch-action: none;"
	on:pointerdown={onPointerDown}
	on:pointermove={onPointerMove}
	on:pointerup={onPointerUp}
	on:pointercancel={onPointerCancel}
	on:touchstart={onPointerDown}
	on:touchmove={onPointerMove}
	on:touchend={onPointerUp}
	on:touchcancel={onPointerCancel}
>
	<slot {isExpanded} {expand} {collapse} {expandedPercentage} />
</div>
