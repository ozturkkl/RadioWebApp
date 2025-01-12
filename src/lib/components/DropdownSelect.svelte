<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	export let value: string | number;
	export let options: Array<{ value: string | number; label: string }>;
	export let classes = 'w-40 sm:w-52 bg-base-100';

	let dropdownRef: HTMLElement | null = null;

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
			const optionElement = document.querySelector(`[data-value="${selectedOption.value}"]`);
			if (optionElement) {
				optionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}
	}

	$: if (typeof window !== 'undefined' && value) {
		scrollToSelected();
	}
</script>

<div class="dropdown">
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
		class="btn {classes} flex-nowrap justify-between"
		aria-label={`Select ${options.find((opt) => opt.value === value)?.label}`}
		on:keydown={handleKeydown}
		on:focus={scrollToSelected}
	>
		<span class="leading-snug">
			{options.find((opt) => opt.value === value)?.label}
		</span>
		<ChevronDown class="ml-2 h-4 w-4 shrink-0" />
	</div>
	<div
		class="menu dropdown-content z-[100] flex max-h-[40vh] flex-col flex-nowrap overflow-y-auto border border-base-content/10 p-0 shadow-xl {classes}"
		style="border-radius: var(--rounded-btn, 0.5rem);"
	>
		{#each options as option}
			<div
				class="p-3 hover:bg-base-200 {option.value === value ? 'bg-base-300' : ''}"
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
