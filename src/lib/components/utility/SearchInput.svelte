<script lang="ts">
	import { Search, X } from 'lucide-svelte';

	export let value = '';
	export let placeholder = '';
	export let ariaLabel = '';
	export let clearLabel = '';
	export let onChange: (value: string) => void = () => {};

	function handleInput(event: Event) {
		const next = (event.currentTarget as HTMLInputElement).value;
		value = next;
		onChange(next);
	}

	function clear(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		value = '';
		onChange('');
	}
</script>

<label class="relative flex min-h-12 min-w-0 flex-1 items-center">
	<Search class="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-base-content/50" />
	<input
		type="text"
		class="input input-bordered h-12 min-h-12 w-full min-w-0 rounded-lg border-base-300 bg-base-200 pl-10 pr-10 text-base-content select-text"
		style="touch-action: auto; -webkit-user-select: text; user-select: text;"
		{placeholder}
		aria-label={ariaLabel || placeholder}
		autocomplete="off"
		autocorrect="off"
		spellcheck="false"
		enterkeyhint="search"
		bind:value
		on:input={handleInput}
	/>
	{#if value}
		<button
			type="button"
			class="absolute right-2 flex h-8 w-8 items-center justify-center rounded-md text-base-content/50 hover:bg-base-300 hover:text-base-content"
			aria-label={clearLabel || ariaLabel}
			on:click|stopPropagation|preventDefault={clear}
		>
			<X class="h-4 w-4" />
		</button>
	{/if}
</label>
