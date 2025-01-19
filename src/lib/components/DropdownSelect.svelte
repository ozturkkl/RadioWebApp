<script lang="ts">
	import { scrollIntoViewPromise } from '$lib/util/scrollIntoViewPromised';
	import { ChevronDown } from 'lucide-svelte';
	export let value: string | number;
	export let options: Array<{ value: string | number; label: string }>;
	export let dropDirection: 'top' | 'bottom' = 'bottom';
	export let backgroundColor = 'bg-base-100';
	export let optionTextCenter = false;
	export let limitHeight = true;
	export let matchOptionWidth = true;

	let dropdownRef: HTMLElement | null = null;
	let dropdownContentRef: HTMLElement | null = null;

	function handleSelect(newValue: string | number) {
		value = newValue;
		// Close dropdown by removing focus from the button
		const activeElement = document.activeElement as HTMLElement;
		if (activeElement) {
			activeElement.blur();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		const currentIndex = options.findIndex((opt) => opt.value === value);
		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				newIndex = currentIndex + 1 >= options.length ? 0 : currentIndex + 1;
				break;
			case 'ArrowUp':
				event.preventDefault();
				newIndex = currentIndex - 1 < 0 ? options.length - 1 : currentIndex - 1;
				break;
			case 'Enter':
			case 'Escape':
			case 'Space':
				event.preventDefault();
				const activeElement = document.activeElement as HTMLElement;
				if (activeElement) {
					activeElement.blur();
				}
				break;
		}

		if (newIndex !== currentIndex) {
			value = options[newIndex].value;
		}
	}

	function scrollToSelected() {
		const selectedOption = options.find((opt) => opt.value === value);
		if (selectedOption) {
			const optionElement = dropdownContentRef?.querySelector(
				`[data-value="${selectedOption.value}"]`
			);
			if (optionElement) {
				scrollIntoViewPromise(optionElement, { behavior: 'smooth', block: 'nearest' });
			}
		}
	}

	async function scrollToContent() {
		if (!dropdownContentRef) return;
		await scrollIntoViewPromise(dropdownContentRef, { behavior: 'smooth', block: 'center' });
		scrollToSelected();
	}

	$: if (typeof window !== 'undefined' && value) {
		scrollToSelected();
	}
</script>

<div class="dropdown {dropDirection === 'top' ? 'dropdown-top' : ''}">
	<button
		tabindex="-1"
		aria-hidden="true"
		style="display: none;"
		on:click|stopPropagation|preventDefault={() => {
			dropdownRef?.focus();
		}}
	></button>

	<div
		bind:this={dropdownRef}
		role="button"
		tabindex="0"
		class="h-full w-full"
		aria-label={`Select ${options.find((opt) => opt.value === value)?.label}`}
		on:keydown={handleKeydown}
		on:focus={scrollToContent}
	>
		{#if $$slots.trigger}
			<slot name="trigger" />
		{:else}
			<div class="btn w-40 flex-nowrap justify-between sm:w-52 {backgroundColor}">
				<span class="leading-snug">
					{options.find((opt) => opt.value === value)?.label}
				</span>
				<ChevronDown class="ml-2 h-4 w-4 shrink-0" />
			</div>
		{/if}
	</div>
	<div
		bind:this={dropdownContentRef}
		class="dropdown-content z-[100] flex {limitHeight ? 'max-h-[40vh]' : 'max-h-[100dvh]'} cursor-pointer flex-col flex-nowrap overflow-y-auto border border-base-content/10 p-0 shadow-xl {optionTextCenter
			? 'text-center'
			: ''} {backgroundColor}"
		style="border-radius: var(--rounded-btn, 0.5rem); {matchOptionWidth
			? `min-width: ${dropdownRef?.clientWidth}px; max-width: ${dropdownRef?.clientWidth}px`
			: ''} {dropdownRef?.clientWidth}px"
	>
		{#each options as option}
			<div
				class="p-3 {option.value === value ? 'bg-primary/25' : 'hover:bg-base-300/50'}"
				style="border-radius: var(--rounded-btn, 0.5rem);"
				on:click|stopPropagation|preventDefault={() => handleSelect(option.value)}
				on:keydown={handleKeydown}
				role="option"
				aria-selected={option.value === value}
				data-value={option.value}
				tabindex={-1}
			>
				{option.label}
			</div>
		{/each}
	</div>
</div>
