<script lang="ts" context="module">
	export const cardStyles = {
		container:
			'relative w-full rounded-lg border border-1 border-base-300 bg-base-200 shadow transition-all hover:shadow-xl',
		hoverScale: 'hover:scale-[1.02]',
		content: {
			wrapper: 'flex min-w-0 gap-2 sm:gap-4',
			image: 'h-24 w-24 rounded-lg object-cover',
			textContainer: 'w-0 flex-1',
			title: 'truncate text-lg font-bold text-base-content pr-5 mt-1',
			description: 'text-base-content-secondary line-clamp-2 pr-2'
		}
	} as const;
</script>

<script lang="ts">
	import type { Radio } from '$lib/util/fetchRadios';
	import { favorites } from '$lib/stores/favorites';
	import { playRadio } from '$lib/stores/player';
	import FavoriteButton from './FavoriteButton.svelte';

	export let radio: Radio;

	$: trackDescription =
		radio.trackInfo.artist || radio.trackInfo.title
			? `${radio.trackInfo.artist} - ${radio.trackInfo.title}`
			: undefined;
</script>

<div
	class="{cardStyles.container} {cardStyles.hoverScale}"
	on:click={() => playRadio(radio)}
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			playRadio(radio);
		}
	}}
	role="button"
	tabindex="0"
>
	<FavoriteButton
		isFavorite={$favorites.radios.has(radio.title)}
		onClick={() => favorites.toggleRadio(radio.title)}
	/>
	<div class={cardStyles.content.wrapper}>
		<img src={radio.image} alt={radio.title} class={cardStyles.content.image} />
		<div class={cardStyles.content.textContainer}>
			<h3 class={cardStyles.content.title}>{radio.title}</h3>
			{#if trackDescription}
				<p class={cardStyles.content.description}>
					{trackDescription}
				</p>
			{/if}
		</div>
	</div>
</div>
