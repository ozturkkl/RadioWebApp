<script lang="ts">
	import type { Podcast, Episode } from '$lib/util/fetchPodcasts';
	import { favorites } from '$lib/stores/favorites';
	import { playPodcast } from '$lib/stores/player';
	import { playerStore } from '$lib/stores/player';
	import { cardStyles } from './RadioCard.svelte';
	import FavoriteButton from './FavoriteButton.svelte';
	import { formatTime } from '$lib/util/time';

	export let podcast: Podcast;
	export let expanded = false;
	export let onExpand: (podcastId: string, isExpanded: boolean) => void;

	function getEpisodeClasses(episode: Episode, podcast: Podcast) {
		const isActive =
			$playerStore.type === 'podcast' &&
			$playerStore.currentEpisode?.id === episode.id &&
			$playerStore.currentPodcast?.id === podcast.id;
		const baseClasses =
			'w-full rounded-lg border border-base-300 p-2 text-left shadow hover:shadow-xl mr-2';
		return `${baseClasses} ${isActive ? 'bg-base-300 shadow-xl outline outline-2 outline-offset-1 outline-primary' : 'bg-base-100 hover:bg-base-300'}`;
	}
</script>

<div
	class="{cardStyles.container} {!expanded ? cardStyles.hoverScale : ''}"
	data-podcast-id={podcast.id}
>
	<FavoriteButton
		isFavorite={$favorites.podcasts.has(podcast.id)}
		onClick={() => favorites.togglePodcast(podcast.id)}
	/>
	<div class="collapse collapse-arrow rounded-lg">
		<input
			type="checkbox"
			checked={expanded}
			on:change={(e) => onExpand(podcast.id, e.currentTarget.checked)}
		/>
		<div class="collapse-title p-0">
			<div class={cardStyles.content.wrapper}>
				<img src={podcast.imageUrl} alt={podcast.title} class={cardStyles.content.image} />
				<div class={cardStyles.content.textContainer}>
					<h3 class={cardStyles.content.title}>
						{podcast.title}
					</h3>
					<p class={cardStyles.content.description}>
						{podcast.description}
					</p>
				</div>
			</div>
		</div>
		<div class="collapse-content relative">
			<div
				class="-mx-3 flex max-h-80 sm:max-h-96 flex-col gap-1 overflow-y-auto border-t border-base-300 p-1 pt-3"
			>
				{#each podcast.items as episode}
					<button
						class={getEpisodeClasses(episode, podcast)}
						on:click={() => playPodcast(podcast, episode)}
					>
						<div class="flex justify-between">
							<span class="font-medium">{episode.title}</span>
							<span class="text-base-content-secondary text-sm">{formatTime(Number(episode.duration))}</span>
						</div>
						{#if episode.description}
							<p class="text-base-content-secondary mt-1 line-clamp-2 text-sm">
								{episode.description}
							</p>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
