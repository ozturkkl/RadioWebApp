<script lang="ts">
	import podcastProgress from '$lib/stores/podcastProgress';
	import { playPodcast } from '$lib/stores/player';
	import type { Podcast, Episode } from '$lib/util/fetchPodcasts';
	import { onMount } from 'svelte';
	import TouchableButton from './TouchableButton.svelte';

	export let podcasts: Podcast[];
	let inProgressPodcasts: (Podcast & { episodeId: string; timestamp: number })[] = [];
	let scrollContainer: HTMLElement;
	let showLeftArrow = false;
	let showRightArrow = false;
	let isTouchDevice = false;

	onMount(() => {
		// Check if device supports touch
		isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
		
		// Initial check after a small delay to ensure content is rendered
		setTimeout(checkArrows, 100);
		
		// Add resize listener
		window.addEventListener('resize', checkArrows);
		
		return () => {
			window.removeEventListener('resize', checkArrows);
		};
	});

	function checkArrows() {
		if (!scrollContainer) return;
		// Hide arrows on touch devices
		if (isTouchDevice) {
			showLeftArrow = false;
			showRightArrow = false;
			return;
		}
		showLeftArrow = scrollContainer.scrollLeft > 0;
		showRightArrow =
			scrollContainer.scrollLeft < scrollContainer.scrollWidth - scrollContainer.clientWidth;
	}

	function scroll(direction: 'left' | 'right') {
		if (!scrollContainer) return;
		const scrollAmount = direction === 'left' ? -200 : 200;
		scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
	}

	$: {
		inProgressPodcasts = podcasts
			.filter((podcast) => $podcastProgress[podcast.id])
			.map((podcast) => ({
				...podcast,
				episodeId: $podcastProgress[podcast.id].episodeId,
				timestamp: $podcastProgress[podcast.id].timestamp
			}))
			.sort((a, b) => {
				return $podcastProgress[b.id].lastPlayed - $podcastProgress[a.id].lastPlayed;
			});
	}

	function handlePodcastClick(podcast: Podcast & { episodeId: string; timestamp: number }) {
		const episode = podcast.items.find((ep: Episode) => ep.id === podcast.episodeId);
		if (episode) {
			playPodcast(podcast, episode, podcast.timestamp);
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

{#if inProgressPodcasts.length > 0}
	<div class="relative">
		{#if showLeftArrow}
			<div class="absolute left-[-4px] top-1/2 z-10 -translate-y-1/2">
				<TouchableButton
					buttonClassName="border-2 border-base-content/20 bg-base-300"
					onClick={() => scroll('left')}
					ariaLabel="Scroll left"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</TouchableButton>
			</div>
		{/if}
		{#if showRightArrow}
			<div class="absolute right-[-4px] top-1/2 z-10 -translate-y-1/2">
				<TouchableButton
					buttonClassName="border-2 border-base-content/20 bg-base-300"
					onClick={() => scroll('right')}
					ariaLabel="Scroll right"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</TouchableButton>
			</div>
		{/if}
		<div
			bind:this={scrollContainer}
			class="no-scrollbar flex gap-1 overflow-x-auto p-1"
			on:scroll={checkArrows}
		>
			{#each inProgressPodcasts as podcast}
				<button
					class="group flex min-w-fit items-center rounded-full bg-accent/15 border-2 border-base-content/20 p-0 transition-colors hover:brightness-120
                    hover:scale-105"
					on:click={() => handlePodcastClick(podcast)}
				>
					<img
						src={podcast.imageUrl}
						alt={podcast.title}
						class="h-12 w-12 flex-shrink-0 rounded-full"
					/>
					<div class="flex flex-col pl-[.2rem] pr-2 text-xs">
						<span class="whitespace-nowrap">{getEpisodeNumber(podcast)}</span>
						<span class="whitespace-nowrap">{getCompletionPercentage(podcast)}%</span>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<div class="divider !mt-0"></div>
{/if}

<style>
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
