<script lang="ts">
	import { favorites } from '$lib/stores/favorites';
	import { playPodcast } from '$lib/stores/player';
	import { playerStore } from '$lib/stores/player';
	import { cardStyles } from './RadioCard.svelte';
	import FavoriteButton from './FavoriteButton.svelte';
	import { formatTime, formatDate } from '$lib/util/time';
	import type { Episode, Podcast } from '$lib/stores/podcasts';

	export let podcast: Podcast;
	export let expanded = false;
	export let onExpand: (podcastId: string, isExpanded: boolean) => void;

	let visibleEpisodes: Episode[] = [];
	const BATCH_SIZE = 10;

	function getEpisodeClasses(episode: Episode, podcast: Podcast) {
		const isActive =
			$playerStore.type === 'podcast' &&
			$playerStore.currentEpisode?.id === episode.id &&
			$playerStore.currentPodcast?.id === podcast.id;
		const baseClasses =
			'w-full rounded-lg border border-base-300 p-2 text-left shadow hover:shadow-xl mr-2 scroll-m-8';
		return `${baseClasses} ${isActive ? 'bg-base-300 shadow-xl outline outline-2 outline-offset-1 outline-primary' : 'bg-base-100 hover:bg-base-300'}`;
	}

	function loadMoreEpisodes() {
		const currentLength = visibleEpisodes.length;
		const nextBatch = podcast.items.slice(currentLength, currentLength + BATCH_SIZE);
		if (nextBatch.length > 0) {
			visibleEpisodes = [...visibleEpisodes, ...nextBatch];
		}
	}

	function handleScroll(e: Event) {
		const target = e.target as HTMLDivElement;
		if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
			requestAnimationFrame(loadMoreEpisodes);
		}
	}

	function loadUpToCurrentEpisode() {
		if ($playerStore.type === 'podcast' && 
			$playerStore.currentPodcast?.id === podcast.id && 
			$playerStore.currentEpisode) {
			const episodeIndex = podcast.items.findIndex(e => e.id === $playerStore.currentEpisode?.id);
			if (episodeIndex >= 0) {
				const batchesNeeded = Math.floor(episodeIndex / BATCH_SIZE) + 1;
				visibleEpisodes = podcast.items.slice(0, batchesNeeded * BATCH_SIZE);
			}
		}
	}

	$: if (expanded && visibleEpisodes.length === 0) {
		// Load initial batch when expanded
		visibleEpisodes = podcast.items.slice(0, BATCH_SIZE);
		// If there's a currently playing episode in this podcast, load up to it
		loadUpToCurrentEpisode();
	} else if (!expanded) {
		// Clear episodes when collapsed to free memory
		visibleEpisodes = [];
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
				<img
					src={podcast.imageUrl}
					alt={podcast.title}
					class={cardStyles.content.image}
					loading="lazy"
					decoding="async"
				/>
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
				on:scroll={handleScroll}
				class="stable-gutter -mx-3 flex max-h-80 flex-col gap-1 overflow-y-auto overflow-x-hidden border-t border-base-300 p-1 pt-3 sm:max-h-96"
			>
				{#if expanded}
					{#each visibleEpisodes as episode (episode.id)}
						<button
							data-episode-id={episode.id}
							class={getEpisodeClasses(episode, podcast)}
							on:click={() => playPodcast(podcast, episode)}
						>
							<div class="grid grid-cols-[1fr_auto] gap-x-0 gap-y-2">
								<span class="line-clamp-2 font-medium">{episode.title}</span>
								{#if episode.duration}
									<div class="text-base-content-secondary text-right text-sm">
										{formatTime(Number(episode.duration))}
									</div>
								{/if}
								{#if episode.description}
									<p class="text-base-content-secondary line-clamp-2 text-sm">
										{episode.description}
									</p>
								{/if}
								{#if episode.pubDate}
									<div class="text-base-content-secondary text-right text-sm">
										{formatDate(episode.pubDate)}
									</div>
								{/if}
							</div>
						</button>
					{/each}
					{#if visibleEpisodes.length < podcast.items.length}
						<div class="text-base-content-secondary py-2 text-center text-sm">
							Scroll for more episodes
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>
