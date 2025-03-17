<script lang="ts">
	import { podcastFavorites } from '$lib/stores/podcast/podcastFavorites';
	import { playerStore, togglePlaylist } from '$lib/stores/player';
	import { cardStyles } from '$lib/components/RadioCard.svelte';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import { formatTime, formatDate } from '$lib/util/time';
	import { ArrowDownNarrowWide, ArrowUpWideNarrow, Info } from 'lucide-svelte';
	import TouchableButton from '$lib/components/TouchableButton.svelte';
	import { fade } from 'svelte/transition';
	import PodcastInfoModal from '$lib/components/modals/PodcastInfoModal.svelte';
	import type { Episode, Podcast } from '$lib/stores/podcast/podcasts';
	import { t } from '$lib/i18n';

	export let podcast: Podcast;
	export let expanded = false;
	export let onExpand: (podcastId: string, isExpanded: boolean) => void;

	let visibleEpisodes: Episode[] = [];
	let isReversed = false;
	const BATCH_SIZE = 20;
	let infoModal: { open: () => void; close: () => void };

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
		const nextBatch = isReversed
			? podcast.items.slice(-(currentLength + BATCH_SIZE), -currentLength).reverse()
			: podcast.items.slice(currentLength, currentLength + BATCH_SIZE);
		if (nextBatch.length > 0) {
			visibleEpisodes = [...visibleEpisodes, ...nextBatch];
		}
	}

	function handleScroll(e: Event) {
		const target = e.target as HTMLDivElement;
		if (target.scrollHeight - target.scrollTop <= target.clientHeight + 1000) {
			requestAnimationFrame(loadMoreEpisodes);
		}
	}

	function loadUpToCurrentEpisode() {
		if (
			$playerStore.type === 'podcast' &&
			$playerStore.currentPodcast?.id === podcast.id &&
			$playerStore.currentEpisode
		) {
			const episodeIndex = podcast.items.findIndex((e: Episode) => e.id === $playerStore.currentEpisode?.id);
			if (episodeIndex >= 0) {
				const indexFromEnd = podcast.items.length - 1 - episodeIndex;
				const batchesNeeded =
					Math.floor((isReversed ? indexFromEnd : episodeIndex) / BATCH_SIZE) + 1;
				const totalToLoad = batchesNeeded * BATCH_SIZE;

				if (isReversed) {
					visibleEpisodes = podcast.items.slice(-totalToLoad).reverse();
				} else {
					visibleEpisodes = podcast.items.slice(0, totalToLoad);
				}
			}
		}
	}

	function reverseEpisodes() {
		isReversed = !isReversed;
		// Recalculate visible episodes from the correct position
		const currentCount = visibleEpisodes.length;
		const episodes = isReversed
			? podcast.items.slice(-currentCount).reverse()
			: podcast.items.slice(0, currentCount);
		visibleEpisodes = episodes;
		loadUpToCurrentEpisode();
		togglePlaylist(podcast.id);
	}

	$: if (expanded && visibleEpisodes.length === 0) {
		// Load initial batch when expanded
		if (isReversed) {
			visibleEpisodes = podcast.items.slice(-BATCH_SIZE).reverse();
		} else {
			visibleEpisodes = podcast.items.slice(0, BATCH_SIZE);
		}
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
		isFavorite={$podcastFavorites[podcast.id]}
		onClick={() => podcastFavorites.togglePodcast(podcast.id)}
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
			<div class="flex justify-end">
				<TouchableButton
					onClick={() => infoModal.open()}
					circle={false}
					ariaLabel={$t.podcast.showMoreInfo}
					small={true}
				>
					<Info class="h-5 w-5" />
				</TouchableButton>
				<TouchableButton
					onClick={reverseEpisodes}
					circle={false}
					ariaLabel={isReversed ? $t.podcast.showOldestFirst : $t.podcast.showNewestFirst}
					small={true}
				>
					<svelte:component this={isReversed ? ArrowUpWideNarrow : ArrowDownNarrowWide} />
				</TouchableButton>
			</div>
			{#if expanded}
				<div
					transition:fade={{ duration: 200 }}
					on:scroll={handleScroll}
					class="stable-gutter -mx-3 flex max-h-80 flex-col gap-1 overflow-y-auto overflow-x-hidden border-t border-base-300 p-1 sm:max-h-96"
				>
					{#each visibleEpisodes as episode (episode.id)}
						<button
							data-episode-id={episode.id}
							class={getEpisodeClasses(episode, podcast)}
							on:click={() => playerStore.playPodcast(podcast, episode)}
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
							{$t.home.scrollForMoreEpisodes}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<PodcastInfoModal bind:this={infoModal} {podcast} />
