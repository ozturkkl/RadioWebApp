<script lang="ts">
	export let onClick: () => void;
	export let disabled = false;
	export let ariaLabel: string;
	export let small = false;
	export let circle = true;
	export let className = '';
	export let buttonClassName = '';

	let isPressed = false;
	let animationTimeout: NodeJS.Timeout;

	function handlePress() {
		isPressed = true;
	}

	function handleRelease() {
		isPressed = false;
		// Clear any existing timeout
		if (animationTimeout) clearTimeout(animationTimeout);
		// Set a new timeout to remove the animation class
		animationTimeout = setTimeout(() => {
			isPressed = false;
		}, 300); // Slightly longer than our animation duration
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			e.stopPropagation();
			handlePress();
			onClick();
			// Simulate release after a short delay
			setTimeout(handleRelease, 100);
		}
	}
</script>

<div
	class="touchable-button flex cursor-pointer items-center p-2 transition-all duration-75 ease-out hover:scale-110 hover:brightness-110 focus-visible:scale-110 focus-visible:brightness-110 {disabled
		? 'pointer-events-none opacity-50'
		: ''} {isPressed ? 'press-down' : ''} {!isPressed ? 'pop-back' : ''} {className}"
	on:click|stopPropagation={onClick}
	on:keydown={handleKeyDown}
	on:pointerdown={handlePress}
	on:pointerup={handleRelease}
	on:pointerleave={handleRelease}
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-label={ariaLabel}
	aria-disabled={disabled}
>
	<button
		tabindex="-1"
		class="btn {small ? 'btn-sm' : ''} {circle
			? 'btn-circle'
			: ''} pointer-events-none border border-base-content/10 bg-base-100 shadow-md hover:shadow-lg {buttonClassName}"
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

	.press-down {
		transform: scale(1);
		transition: transform 0.075s ease-out;
	}

	.pop-back {
		animation: pop-back 0.2s ease-out;
	}

	@keyframes pop-back {
		0% {
			transform: scale(0.95);
		}
		50% {
			transform: scale(1.15);
		}
		100% {
			transform: scale(1.1);
		}
	}
</style>
