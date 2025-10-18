<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';

  export let items: any[] = [];
  export let estimatedRowHeight = 100; // px fallback
  export let buffer = 0;
  export let keyFn: (item: any, index: number) => string | number = (_item, index) => index;
  export let getScrollRoot: (() => HTMLElement | null) | null = null;
  export let debug = false;

  let containerEl: HTMLElement | null = null;
  let scrollRootEl: HTMLElement | null = null;
  let anchorEl: HTMLElement | null = null;
  let vStart = 0;
  let vEnd = 0;
  let rowHeight = estimatedRowHeight;
  let rowGapPx = 0;
  let numCols = 1;
  let resizeObserver: ResizeObserver | null = null;

  function findGridContainer(start: HTMLElement | null): HTMLElement | null {
    let el: HTMLElement | null = start?.parentElement || null;
    while (el) {
      const disp = getComputedStyle(el).display;
      if (disp.includes('grid')) return el;
      el = el.parentElement;
    }
    return null;
  }

  function getOffsetTop(): number {
    if (!scrollRootEl || !anchorEl) return 0;
    let el: HTMLElement | null = anchorEl;
    let offset = 0;
    while (el && el !== scrollRootEl) {
      offset += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }
    if (debug) console.log('[VirtualList] baseOffset ->', offset);
    return offset;
  }

  function isScrollable(el: HTMLElement): boolean {
    const style = getComputedStyle(el);
    return /(auto|scroll)/.test(style.overflowY);
  }

  function findNearestScrollRoot(start: HTMLElement | null): HTMLElement | null {
    let el: HTMLElement | null = start;
    while (el && el.parentElement) {
      if (isScrollable(el)) return el;
      el = el.parentElement as HTMLElement | null;
    }
    return null;
  }

  function updateRowMetrics() {
    if (!containerEl) return;
    const first = containerEl.querySelector('[data-virtual-item]') as HTMLElement | null;
    if (first) {
      const h = first.offsetHeight;
      if (h && Math.abs(h - rowHeight) > 1) {
        rowHeight = h;
        if (debug) console.log('[VirtualList] rowHeight ->', rowHeight);
      }
    }
    const gridEl = findGridContainer(containerEl);
    if (gridEl) {
      const style = getComputedStyle(gridEl);
      const gap = parseFloat(style.rowGap || '0') || 0;
      if (gap !== rowGapPx) {
        rowGapPx = gap;
        if (debug) console.log('[VirtualList] rowGap ->', rowGapPx);
      }
      const gtc = style.gridTemplateColumns || '';
      let cols = 1;
      if (gtc.startsWith('repeat(')) {
        const num = parseInt(gtc.slice(7), 10);
        if (!isNaN(num) && num > 0) cols = num;
      } else if (gtc !== 'none') {
        cols = Math.max(1, gtc.split(' ').filter(Boolean).length);
      }
      if (cols !== numCols) {
        numCols = cols;
        if (debug) console.log('[VirtualList] numCols ->', numCols, gtc);
      }
    } else {
      // Fallback
      numCols = 1;
      rowGapPx = 0;
    }
  }

  function updateWindow() {
    if (!scrollRootEl || !anchorEl) return;
    const total = items.length;
    if (total === 0) {
      vStart = 0;
      vEnd = 0;
      return;
    }
    const rootRect = scrollRootEl.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();
    const rh = Math.max(1, rowHeight + rowGapPx);
    const viewportH = rootRect.height;
    const effectiveScroll = Math.max(0, rootRect.top - anchorRect.top);
    const startRow = Math.max(0, Math.floor(effectiveScroll / rh) - buffer);
    const totalRows = Math.max(1, Math.ceil(total / Math.max(1, numCols)));
    const rowsInView = Math.max(1, Math.ceil(viewportH / rh));
    const startIndex = Math.max(0, Math.min(total - 1, startRow * Math.max(1, numCols)));
    const endIndex = Math.min(total - 1, startIndex + rowsInView * Math.max(1, numCols) - 1);
    if (debug) {
      console.log('[VirtualList] scroll', {
        rootTop: rootRect.top,
        anchorTop: anchorRect.top,
        viewportH,
        rh,
        effectiveScroll,
        startRow,
        totalRows,
        numCols,
        startIndex,
        endIndex,
        total
      });
    }
    if (startIndex !== vStart || endIndex !== vEnd) {
      vStart = startIndex;
      vEnd = endIndex;
    }
  }

  onMount(() => {
    if (typeof window === 'undefined') return;
    scrollRootEl = (getScrollRoot && getScrollRoot()) || findNearestScrollRoot(containerEl) || document.querySelector('.overflow-y-auto') as HTMLElement | null || document.documentElement;
    if (debug) console.log('[VirtualList] mounted. scrollRootEl =', scrollRootEl);
    const onScroll = () => updateWindow();
    const onResize = () => { updateRowMetrics(); updateWindow(); };
    if (scrollRootEl) {
      scrollRootEl.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      updateRowMetrics();
      updateWindow();
    }
    return () => {
      if (scrollRootEl) scrollRootEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  });

  $: if (containerEl) {
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(() => {
      updateRowMetrics();
      updateWindow();
    });
    resizeObserver.observe(containerEl);
  }

  $: items, (async () => {
    await tick();
    updateRowMetrics();
    updateWindow();
  })();

  export function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
    if (!scrollRootEl) return;
    const rh = Math.max(1, rowHeight + rowGapPx);
    const cols = Math.max(1, numCols);
    const row = Math.floor(index / cols);
    const offset = getOffsetTop();
    scrollRootEl.scrollTo({ top: offset + row * rh, behavior });
    updateWindow();
  }
</script>

<!-- Use display: contents so the items participate directly in the parent's grid -->
<div class="contents" bind:this={containerEl}>
  {#if items.length > 0}
    <div bind:this={anchorEl} class="vl-spacer" style="height: 0;"></div>
    <div class="vl-spacer" style={`height: ${Math.floor(vStart / Math.max(1, numCols)) * Math.max(1, rowHeight + rowGapPx)}px;`}></div>
    {#each items.slice(vStart, vEnd + 1) as item, localIndex (keyFn(item, vStart + localIndex))}
      <div data-virtual-item>
        <slot name="item" item={item} index={vStart + localIndex} />
      </div>
    {/each}
    <div class="vl-spacer" style={`height: ${(Math.max(1, Math.ceil(items.length / Math.max(1, numCols))) - (Math.floor(vEnd / Math.max(1, numCols)) + 1)) * Math.max(1, rowHeight + rowGapPx)}px;`}></div>
  {/if}
</div>

<style>
  /* no visual styles; this component is layout-only */
  .vl-spacer { grid-column: 1 / -1; width: 100%; }
</style>


