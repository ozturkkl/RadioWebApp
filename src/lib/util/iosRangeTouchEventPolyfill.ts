import { isIOS } from '$lib/util/isIOS';

export const iosRangeTouchEventPolyfill = (e: TouchEvent) => {
	if (!isIOS()) return;

	e.preventDefault();
	const input = e.target as HTMLInputElement;
	const rect = input.getBoundingClientRect();
	const inputIsVertical = rect.height > rect.width;
	const touchDiff = inputIsVertical
		? rect.bottom - e.touches[0].clientY
		: e.touches[0].clientX - rect.left;
	const pos = touchDiff / (inputIsVertical ? rect.height : rect.width);
	const value = pos * (parseFloat(input.max) - parseFloat(input.min)) + parseFloat(input.min);

	// set the input target element value
	input.value = value.toString();
	input.dispatchEvent(new Event('input', { bubbles: true }));
};
