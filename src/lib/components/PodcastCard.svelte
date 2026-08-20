<script lang="ts">
	import { podcastFavorites } from '$lib/stores/podcast/podcastFavorites';
	import { playerStore, togglePlaylist } from '$lib/stores/player';
	import { cardStyles } from '$lib/components/RadioCard.svelte';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import { formatTime, formatDate } from '$lib/util/time';
	import { ArrowDownNarrowWide, ArrowUpWideNarrow, Info, Link } from 'lucide-svelte';
	import TouchableButton from '$lib/components/utility/TouchableButton.svelte';
	import { fade } from 'svelte/transition';
	import PodcastInfoModal from '$lib/components/modals/PodcastInfoModal.svelte';
	import type { Episode, Podcast } from '$lib/stores/podcast/podcasts';
	import { formatString, t } from '$lib/i18n';
	import { sharePodcast, copyTextToClipboard } from '$lib/util/share';
	import { showTooltip } from '$lib/util/tooltip';
	import { get } from 'svelte/store';
	import { clampText } from '$lib/util/text';
	import { splitHighlight, type MatchField } from '$lib/util/search';

	export let podcast: Podcast;
	export let expanded = false;
	export let onExpand: (podcastId: string, isExpanded: boolean) => void;
	export let matchField: MatchField | undefined = undefined;
	export let matchedEpisodeIds: string[] | undefined = undefined;
	export let highlightQuery = '';

	let imageLoaded = false;

	let visibleEpisodes: Episode[] = [];
	let isReversed = false;
	const BATCH_SIZE = 20;
	let infoModal: { open: () => void; close: () => void };
	let shareTooltipAnchorEl: HTMLElement | undefined;

	function getEpisodeClasses(episode: Episode, podcast: Podcast) {
		const isActive =
			$playerStore.type === 'podcast' &&
			$playerStore.currentEpisode?.id === episode.id &&
			$playerStore.currentPodcast?.id === podcast.id;
		const baseClasses =
			'w-full rounded-lg border border-base-300 p-2 text-left shadow hover:shadow-xl mr-2 scroll-m-8';
		return `${baseClasses} ${isActive ? 'bg-base-300 shadow-xl outline outline-2 outline-offset-1 outline-primary' : 'bg-base-100 hover:bg-base-300'}`;
	}

	function getEpisodeSource(
		source: Podcast,
		field: MatchField | undefined,
		ids?: string[]
	): Episode[] {
		if (field !== 'episode' || !ids || ids.length === 0) return source.items;
		const idSet = new Set(ids);
		return source.items.filter((episode) => idSet.has(episode.id));
	}

	$: episodeSource = getEpisodeSource(podcast, matchField, matchedEpisodeIds);
	$: sourceKey = `${podcast.id}:${matchField ?? ''}:${matchField === 'episode' ? (matchedEpisodeIds ?? []).join('|') : ''}`;
	$: badgeLabel =
		matchField === 'title'
			? $t.home.searchMatchTitle
			: matchField === 'episode'
				? (matchedEpisodeIds?.length ?? 0) === 1
					? $t.home.searchMatchEpisode
					: formatString($t.home.searchMatchEpisodes, { count: matchedEpisodeIds?.length ?? 0 })
				: '';

	function loadMoreEpisodes() {
		const currentLength = visibleEpisodes.length;
		const nextBatch = isReversed
			? episodeSource.slice(-(currentLength + BATCH_SIZE), -currentLength).reverse()
			: episodeSource.slice(currentLength, currentLength + BATCH_SIZE);
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
			const episodeIndex = episodeSource.findIndex(
				(e: Episode) => e.id === $playerStore.currentEpisode?.id
			);
			if (episodeIndex >= 0) {
				const indexFromEnd = episodeSource.length - 1 - episodeIndex;
				const batchesNeeded =
					Math.floor((isReversed ? indexFromEnd : episodeIndex) / BATCH_SIZE) + 1;
				const totalToLoad = batchesNeeded * BATCH_SIZE;

				if (isReversed) {
					visibleEpisodes = episodeSource.slice(-totalToLoad).reverse();
				} else {
					visibleEpisodes = episodeSource.slice(0, totalToLoad);
				}
			}
		}
	}

	function reverseEpisodes() {
		isReversed = !isReversed;
		// Recalculate visible episodes from the correct position
		const currentCount = visibleEpisodes.length;
		const episodes = isReversed
			? episodeSource.slice(-currentCount).reverse()
			: episodeSource.slice(0, currentCount);
		visibleEpisodes = episodes;
		loadUpToCurrentEpisode();
		togglePlaylist(podcast.id);
	}

	async function sharePodcastLink() {
		if (typeof window === 'undefined') return;
		const url = await sharePodcast(podcast.id, podcast.items[0]?.id, 0);
		if (!url) return;
		await copyTextToClipboard(url);
		showTooltip(get(t).player.linkCopied, 3000, shareTooltipAnchorEl);
	}

	let lastPodcastId = podcast.id;
	$: if (podcast.id !== lastPodcastId) {
		lastPodcastId = podcast.id;
		imageLoaded = false;
		isReversed = false;
	}

	let lastSourceKey = '';
	$: if (!expanded) {
		if (visibleEpisodes.length > 0 || lastSourceKey) {
			lastSourceKey = '';
			visibleEpisodes = [];
		}
	} else if (visibleEpisodes.length === 0 || lastSourceKey !== sourceKey) {
		lastSourceKey = sourceKey;
		visibleEpisodes = isReversed
			? episodeSource.slice(-BATCH_SIZE).reverse()
			: episodeSource.slice(0, BATCH_SIZE);
		loadUpToCurrentEpisode();
	}
</script>

<div
	class="podcast-card min-w-0 overflow-hidden {cardStyles.container} {!expanded ? cardStyles.hoverScale : ''}"
	data-podcast-id={podcast.id}
>
	<FavoriteButton
		isFavorite={$podcastFavorites[podcast.id]}
		onClick={() => podcastFavorites.togglePodcast(podcast.id)}
	/>
	<div class="collapse collapse-arrow min-w-0 overflow-hidden rounded-lg">
		<input
			type="checkbox"
			aria-label={`${podcast.title} podcast expand button`}
			checked={expanded}
			on:change={(e) => onExpand(podcast.id, e.currentTarget.checked)}
		/>
		<div class="collapse-title min-w-0 max-w-full overflow-hidden p-0 pr-8">
			<div class="{cardStyles.content.wrapper} w-full">
				<img
					src={podcast.imageUrl}
					alt={`${podcast.title} podcast image`}
					class="{cardStyles.content.image} {imageLoaded ? '' : 'invisible'} shrink-0"
					loading="lazy"
					decoding="async"
					draggable="false"
					on:load={() => (imageLoaded = true)}
				/>
				<div class="flex min-h-24 min-w-0 flex-1 items-center overflow-hidden">
					<div class="flex min-w-0 items-center gap-2">
						<h3
							class="min-w-0 flex-1 break-words text-lg font-bold leading-snug text-base-content line-clamp-3"
						>
							{#if highlightQuery}
								{#each splitHighlight(podcast.title, highlightQuery) as part}
									{#if part.hit}<span class="text-primary">{part.text}</span>{:else}{part.text}{/if}
								{/each}
							{:else}
								{podcast.title}
							{/if}
						</h3>
						{#if badgeLabel}
							<span
								class="relative z-10 shrink-0 whitespace-nowrap rounded-md bg-primary/25 px-2 py-0.5 text-xs font-medium text-base-content"
							>
								{badgeLabel}
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
		<div class="collapse-content relative">
			<div class="flex justify-end">
				<TouchableButton
					onClick={() => infoModal.open()}
					circle={false}
					ariaLabel={$t.podcast.showMoreInfo}
					size="sm"
				>
					<Info class="h-5 w-5" />
				</TouchableButton>
				<TouchableButton
					bind:el={shareTooltipAnchorEl}
					onClick={sharePodcastLink}
					circle={false}
					ariaLabel={$t.player.sharePodcast}
					size="sm"
				>
					<Link class="h-5 w-5" />
				</TouchableButton>
				<TouchableButton
					onClick={reverseEpisodes}
					circle={false}
					ariaLabel={isReversed ? $t.podcast.showOldestFirst : $t.podcast.showNewestFirst}
					size="sm"
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
								<span class="line-clamp-2 font-medium">
									{#if highlightQuery}
										{#each splitHighlight(episode.title, highlightQuery) as part}
											{#if part.hit}<span class="font-semibold text-primary">{part.text}</span
												>{:else}{part.text}{/if}
										{/each}
									{:else}
										{episode.title}
									{/if}
								</span>
								{#if episode.duration}
									<div class="text-base-content-secondary text-right text-sm">
										{formatTime(Number(episode.duration))}
									</div>
								{/if}
								{#if episode.description}
									<p class="text-base-content-secondary line-clamp-2 text-sm">
										{clampText(episode.description, 100)}
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
					{#if visibleEpisodes.length < episodeSource.length}
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
