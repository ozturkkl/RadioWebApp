// Minimal dedupe: remember last tooltip text per trigger (or 'none' for fallback)
const lastTooltipTextByTrigger = new Map<HTMLElement | 'none', string>();

export function showTooltip(
	tooltipText: string,
	durationMs: number = 3000,
	triggerEl?: HTMLElement
): void {
	const key: HTMLElement | 'none' = triggerEl ?? 'none';
	if (lastTooltipTextByTrigger.get(key) === tooltipText) return;
	lastTooltipTextByTrigger.set(key, tooltipText);

	const container = document.createElement('div');
	container.className = `fixed z-[9999] pointer-events-none`;
	container.style.opacity = '0';
	container.style.transform = 'scale(0.95)';
	container.style.transition = 'opacity 200ms ease, transform 200ms ease';

	const toast = document.createElement('div');
	toast.className = `rounded-md bg-base-200 text-base-content px-3 py-1 border border-base-content/20 shadow-xl ring-1 ring-base-content/10`;
	toast.textContent = tooltipText;
	container.appendChild(toast);
	document.body.appendChild(container);

	// Measure and place
	void container.getBoundingClientRect();
	const margin = 8;
	const width = container.offsetWidth;
	const height = container.offsetHeight;
	let left: number;
	let top: number;
	if (triggerEl) {
		const anchorRect = triggerEl.getBoundingClientRect();
		const offset = 8;
		left = anchorRect.left + anchorRect.width / 2 - width / 2;
		top = anchorRect.top - offset - height;
		if (top < margin) {
			// place below if not enough room above
			top = anchorRect.bottom + offset;
		}
	} else {
		// Fallback: bottom center
		left = window.innerWidth / 2 - width / 2;
		top = window.innerHeight - height - 100;
	}
	// Clamp to viewport
	left = Math.min(Math.max(margin, left), window.innerWidth - margin - width);
	top = Math.min(Math.max(margin, top), window.innerHeight - margin - height);
	container.style.left = `${Math.round(left)}px`;
	container.style.top = `${Math.round(top)}px`;

	// Animate in
	requestAnimationFrame(() => {
		container.style.opacity = '1';
		container.style.transform = 'scale(1)';
	});

	let dismissed = false;
	const dismiss = () => {
		if (dismissed) return;
		dismissed = true;
		// Allow immediate re-trigger by clearing dedupe right away
		lastTooltipTextByTrigger.delete(key);
		container.style.opacity = '0';
		container.style.transform = 'scale(0.95)';
		window.clearTimeout(hideTimer);
		setTimeout(() => {
			container.remove();
		}, 200);
	};

	// Early dismiss on any user interaction (pointerdown is more immediate than click)
	window.addEventListener('pointerdown', dismiss, { once: true, capture: true });
	window.addEventListener('scroll', dismiss, { once: true, capture: true });
	window.addEventListener('wheel', dismiss, { once: true, capture: true });
	window.addEventListener('touchmove', dismiss, { once: true, capture: true });

	// Animate out and cleanup
	const hideTimer = window.setTimeout(dismiss, durationMs);
}
