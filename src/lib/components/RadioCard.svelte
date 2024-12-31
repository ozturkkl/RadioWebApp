<script lang="ts">
	import type { Radio } from '$lib/util/fetchRadios';
	import { favorites } from '$lib/stores/favorites';
	import { playRadio } from '$lib/stores/player';

	export let radio: Radio;
</script>

<div
	class="radio-item relative w-full rounded-lg border bg-base-200 shadow transition-all hover:scale-[1.02] hover:shadow-xl"
	on:click={() => playRadio(radio)}
	on:keydown|preventDefault|stopPropagation={(e) =>
		(e.key === 'Enter' || e.key === ' ') && playRadio(radio)}
	role="button"
	tabindex="0"
>
	<button
		class="absolute left-0 top-0 z-10 rounded-lg bg-base-100/50 p-1 hover:bg-base-100"
		style="border-top-right-radius: 0; border-bottom-right-radius: 10px; border-bottom-left-radius: 0px;"
		on:click|stopPropagation={() => favorites.toggleRadio(radio.title)}
		aria-label={$favorites.radios.has(radio.title) ? 'Remove from favorites' : 'Add to favorites'}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 fill-current {$favorites.radios.has(radio.title)
				? 'text-yellow-400'
				: 'text-base-content/50 hover:text-yellow-400'}"
			viewBox="0 0 20 20"
		>
			<path
				d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
			/>
		</svg>
	</button>
	<div class="flex gap-2 sm:gap-4">
		<img src={radio.image} alt={radio.title} class="h-24 w-24 rounded-lg object-cover" />
		<div class="min-w-0 flex-1">
			<h3 class="truncate text-lg font-bold text-base-content">{radio.title}</h3>
			{#if radio.trackInfo.artist || radio.trackInfo.title}
				<p class="text-base-content-secondary truncate">
					{radio.trackInfo.artist} - {radio.trackInfo.title}
				</p>
			{/if}
		</div>
	</div>
</div>
