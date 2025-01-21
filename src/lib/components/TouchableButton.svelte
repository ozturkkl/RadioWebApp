<script lang="ts">
	export let onClick: () => void = () => {};
	export let disabled = false;
	export let ariaLabel: string;
	export let small = false;
	export let circle = true;
	export let className = '';
	export let buttonClassName = '';

	let isPressed = false;
	let isHovered = false;
	let isClicked = false;

	$: {
		if (isClicked) {
			setTimeout(() => {
				isClicked = false;
			}, 300);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			e.stopPropagation();
			isClicked = true;
			onClick();
		}
	}

	function handleEvent(e: Event) {
		e.stopPropagation();
		if (e.type === 'click') {
			isClicked = true;
			onClick();
		}
		if (e.type === 'contextmenu') {
			e.preventDefault();
		}
		if (e.type === 'pointerenter') {
			isHovered = true;
		}
		if (e.type === 'pointerdown') {
			isPressed = true;
		}
		if (e.type === 'pointerup') {
			isPressed = false;
		}
		if (e.type === 'pointerleave') {
			isHovered = false;
			isPressed = false;
		}
	}
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
	class="touchable-button flex cursor-pointer items-center p-2 transition-all duration-75 ease-out focus-visible:scale-110 focus-visible:brightness-110 w-max {disabled
		? 'pointer-events-none opacity-50'
		: ''} {isHovered ? 'scale-110 brightness-110' : ''} {isPressed ? 'scale-95' : ''} {isClicked
		? 'pop-back'
		: ''}
		 {className}"
	on:keydown={handleKeyDown}
	on:click={handleEvent}
	on:pointerenter={handleEvent}
	on:pointerleave={handleEvent}
	on:pointerdown={handleEvent}
	on:pointerup={handleEvent}
	on:contextmenu={handleEvent}
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-label={ariaLabel}
	aria-disabled={disabled}
>
	<button
		tabindex="-1"
		class="btn {small ? 'btn-sm' : ''} {circle
			? 'btn-circle border border-base-content/10 bg-base-100 shadow-md hover:shadow-lg'
			: ''} pointer-events-none {buttonClassName}"
		aria-hidden="true"
	>
		<slot />
	</button>
</div>

<style>
	.touchable-button {
		outline: none;
	}

	.touchable-button:focus-visible {
		outline: none;
		button {
			outline: 2px solid currentColor;
		}
	}

	/* Remove only the outline from dropdown buttons */
	:global(.dropdown .touchable-button) {
		outline: none !important;
	}

	.pop-back {
		animation: pop-back 0.2s ease-out;
	}

	@keyframes pop-back {
		0% {
			transform: scale(0.95);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1.1);
		}
	}
</style>
