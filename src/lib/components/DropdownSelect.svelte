<script lang="ts">
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
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-4 w-4 shrink-0"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
				clip-rule="evenodd"
			/>
		</svg>
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
