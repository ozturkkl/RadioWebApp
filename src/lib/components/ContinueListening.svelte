<script lang="ts">
	import podcastProgress from '$lib/stores/podcastProgress';
	import radioProgress from '$lib/stores/radioProgress';
	import { playPodcast, playRadio } from '$lib/stores/player';
	import { type Podcast, type Episode, fetchPodcastsFromRssFeeds } from '$lib/util/fetchPodcasts';
	import type { Radio } from '$lib/util/fetchRadios';
	import { onMount } from 'svelte';
	import TouchableButton from './TouchableButton.svelte';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { radios } from '$lib/stores/radios';

	let podcasts: Podcast[] = [];

	type ContinueListeningItem =
		| {
				type: 'podcast';
				item: Podcast & { episodeId: string; timestamp: number };
				lastPlayed: number;
		  }
		| {
				type: 'radio';
				item: Radio;
				lastPlayed: number;
		  };

	let continueListeningItems: ContinueListeningItem[] = [];
	let scrollContainer: HTMLElement;
	let showLeftArrow = false;
	let showRightArrow = false;
	let isTouchDevice = false;

	onMount(() => {
		fetchPodcastsFromRssFeeds().then((p) => (podcasts = p));
		isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
		setTimeout(checkArrows, 100);
		window.addEventListener('resize', checkArrows);
		return () => {
			window.removeEventListener('resize', checkArrows);
		};
	});

	function checkArrows() {
		if (!scrollContainer) return;
		if (isTouchDevice) {
			showLeftArrow = false;
			showRightArrow = false;
			return;
		}
		showLeftArrow = scrollContainer.scrollLeft > 10;
		showRightArrow =
			scrollContainer.scrollLeft < scrollContainer.scrollWidth - scrollContainer.clientWidth - 10;
	}

	function scroll(direction: 'left' | 'right') {
		if (!scrollContainer) return;
		const scrollAmount = direction === 'left' ? -200 : 200;
		scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
	}

	$: {
		const podcastItems = podcasts
			.filter((podcast) => $podcastProgress[podcast.id])
			.map((podcast) => ({
				type: 'podcast' as const,
				item: {
					...podcast,
					episodeId: $podcastProgress[podcast.id].episodeId,
					timestamp: $podcastProgress[podcast.id].timestamp
				},
				lastPlayed: $podcastProgress[podcast.id].lastPlayed
			}));

		const radioItems = $radios
			.filter((radio) => $radioProgress[radio.id])
			.map((radio) => ({
				type: 'radio' as const,
				item: radio,
				lastPlayed: $radioProgress[radio.id].lastPlayed
			}));

		continueListeningItems = [...podcastItems, ...radioItems].sort((a, b) => {
			return b.lastPlayed - a.lastPlayed;
		});

		setTimeout(checkArrows, 0);
	}

	function handleItemClick(item: ContinueListeningItem) {
		if (item.type === 'podcast') {
			const episode = item.item.items.find((ep: Episode) => ep.id === item.item.episodeId);
			if (episode) {
				playPodcast(item.item, episode, item.item.timestamp);
			}
		} else {
			playRadio(item.item);
		}
	}

	function getEpisodeNumber(podcast: Podcast & { episodeId: string }) {
		const episode = podcast.items.find((ep) => ep.id === podcast.episodeId);
		const index = podcast.items.indexOf(episode!) + 1;
		return `${index}/${podcast.items.length}`;
	}

	function getCompletionPercentage(podcast: Podcast & { episodeId: string; timestamp: number }) {
		const episode = podcast.items.find((ep) => ep.id === podcast.episodeId);
		const duration = Number(episode?.duration);
		if (!duration) return 0;
		return Math.round((podcast.timestamp / duration) * 100);
	}
</script>

{#if continueListeningItems.length > 0}
	<div class="relative border-b border-base-300 py-2">
		{#if showLeftArrow}
			<div class="absolute left-[-4px] top-1/2 z-10 -translate-y-1/2 pl-3 sm:pl-0">
				<TouchableButton onClick={() => scroll('left')} ariaLabel="Scroll left">
					<ChevronLeft class="h-5 w-5" />
				</TouchableButton>
			</div>
		{/if}
		{#if showRightArrow}
			<div class="absolute right-[-4px] top-1/2 z-10 -translate-y-1/2 pr-3 sm:pr-0">
				<TouchableButton onClick={() => scroll('right')} ariaLabel="Scroll right">
					<ChevronRight class="h-5 w-5" />
				</TouchableButton>
			</div>
		{/if}
		<div
			bind:this={scrollContainer}
			class="no-scrollbar flex gap-1 overflow-x-auto p-1"
			on:scroll={checkArrows}
		>
			{#each continueListeningItems as item, index}
				<button
					class="hover:brightness-120 group flex min-w-fit items-center rounded-full border-2 border-base-content/20 bg-accent/15 p-0 transition-colors
                    transition-transform hover:scale-105 {index === 0
						? 'ml-3 sm:ml-0'
						: ''} {index === continueListeningItems.length - 1 ? 'mr-3 sm:mr-0' : ''}"
					on:click={() => handleItemClick(item)}
				>
					<img
						src={item.type === 'podcast' ? item.item.imageUrl : item.item.image}
						alt={item.item.title}
						class="h-12 w-12 flex-shrink-0 rounded-full"
					/>
					{#if item.type === 'podcast'}
						<div class="flex flex-col pl-[.2rem] pr-2 text-xs">
							<span class="whitespace-nowrap">{getEpisodeNumber(item.item)}</span>
							<span class="whitespace-nowrap">{getCompletionPercentage(item.item)}%</span>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}
