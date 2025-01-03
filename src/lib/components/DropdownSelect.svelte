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
</script>

<div class="dropdown dropdown-end">
	<button class="btn {classes} flex-nowrap justify-between">
		<span class="leading-snug">
			{options.find((opt) => opt.value === value)?.label}
		</span>
		<ChevronDown class="h-4 w-4 shrink-0" />
	</button>
	<div role="button" class="dropdown-content z-[100]">
		<ul class="menu {classes} rounded-box border border-base-content/10 shadow-xl">
			{#each options as option}
				<li>
					<button
						class="py-3 hover:bg-base-200 {option.value === value ? 'active bg-primary' : ''}"
						on:click={() => handleSelect(option.value)}
					>
						{option.label}
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>
