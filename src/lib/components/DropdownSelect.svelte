<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	export let value: string | number;
	export let options: Array<{ value: string | number; label: string }>;
	export let classes = 'w-40 sm:w-52 bg-base-100';

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

<div class="dropdown dropdown-end">
	<button
		class="btn {classes} flex-nowrap justify-between"
		on:keydown={handleKeydown}
		on:focus={scrollToSelected}
	>
		<span class="leading-snug">
			{options.find((opt) => opt.value === value)?.label}
		</span>
		<ChevronDown class="ml-2 h-4 w-4 shrink-0" />
	</button>
	<div role="button" class="dropdown-content z-[100]">
		<ul
			class="menu {classes} flex max-h-[40vh] flex-col flex-nowrap overflow-y-auto rounded-box border border-base-content/10 shadow-xl"
		>
			{#each options as option}
				<li>
					<button
						class="py-3 hover:bg-base-200 {option.value === value ? 'active bg-primary' : ''}"
						on:click={() => handleSelect(option.value)}
						data-value={option.value}
						tabindex={-1}
					>
						{option.label}
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>
