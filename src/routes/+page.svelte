<script lang="ts">
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { onMount } from 'svelte';
	import { fetchPodcastsFromRssFeeds } from '$lib/util/fetchPodcasts';
	import { fetchRadios } from '$lib/util/fetchRadios';
	import type { Radio } from '$lib/util/fetchRadios';
	import type { Podcast, Episode } from '$lib/util/fetchPodcasts';
	import { settings } from '$lib/stores/settings';
	import { playRadio, playPodcast, playerStore } from '$lib/stores/player';

	let podcasts: Podcast[] = [];
	let radios: Radio[] = [];
	let expandedPodcasts = new Set<string>();

	function getEpisodeClasses(episode: Episode, podcast: Podcast) {
		const isActive = $playerStore.type === 'podcast' && 
			$playerStore.currentEpisode?.id === episode.id && 
			$playerStore.currentPodcast?.id === podcast.id;
		const baseClasses = "w-full rounded-lg border border-base-300 p-2 text-left shadow hover:shadow-xl";
		return `${baseClasses} ${isActive ? 'bg-base-100 shadow-xl' : 'bg-base-300 hover:bg-base-100'}`;
	}

	onMount(async () => {
		podcasts = await fetchPodcastsFromRssFeeds();
		radios = await fetchRadios();
	});

	function handlePodcastExpand(podcastId: string, isExpanded: boolean) {
		if (isExpanded) {
			expandedPodcasts.add(podcastId);
			if ($settings.autoCollapse) {
				// Close other expanded podcasts
				const checkboxes = document.querySelectorAll('.collapse input[type="checkbox"]');
				checkboxes.forEach((element) => {
					const checkbox = element as HTMLInputElement;
					const currentPodcastId = checkbox.parentElement?.parentElement?.dataset.podcastId;
					if (checkbox.checked && currentPodcastId && currentPodcastId !== podcastId) {
						checkbox.checked = false;
						expandedPodcasts.delete(currentPodcastId);
					}
				});
			}
			// Find and scroll to the expanded podcast card
			setTimeout(() => {
				const podcastCard = document.querySelector(`[data-podcast-id="${podcastId}"]`);
				podcastCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}, 150); // Wait for collapse animation to start
		} else {
			expandedPodcasts.delete(podcastId);
		}
		// Force Svelte reactivity
		expandedPodcasts = expandedPodcasts;
	}
</script>

<main class="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
	<div class="space-y-4 sm:space-y-6">
		<section>
			<h2 class="mb-2 sm:mb-4 text-2xl font-bold">Radio Stations</h2>
			<div class="grid grid-cols-1 items-start gap-2 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3">
				{#if radios.length > 0}
					{#each radios as radio}
						<button
							class="radio-item w-full rounded-lg bg-base-200 border border-base-300 p-2 sm:p-4 transition-all hover:scale-[1.02] shadow hover:shadow-xl text-left"
							on:click={() => playRadio(radio)}
							on:keydown={(e) => e.key === 'Enter' && playRadio(radio)}
						>
							<div class="flex gap-2 sm:gap-4">
								<img
									src={radio.image}
									alt={radio.title}
									class="h-24 w-24 rounded-lg object-cover"
								/>
								<div class="min-w-0 flex-1">
									<h3 class="text-lg font-bold text-base-content truncate">{radio.title}</h3>
									{#if radio.trackInfo.artist || radio.trackInfo.title}
										<p class="text-base-content-secondary truncate">
											{radio.trackInfo.artist} - {radio.trackInfo.title}
										</p>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				{:else}
					<p class="text-base-content-secondary">Loading stations...</p>
				{/if}
			</div>
		</section>

		<div class="divider"></div>

		<section>
			<h2 class="mb-4 text-2xl font-bold">Podcast Feed</h2>
			<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3">
				{#if podcasts.length > 0}
					{#each podcasts as podcast}
						<div
							class="podcast-item w-full rounded-lg bg-base-200 border border-base-300 transition-all {!expandedPodcasts.has(podcast.id) ? 'hover:scale-[1.02]' : ''} shadow hover:shadow-xl"
							data-podcast-id={podcast.id}
						>
							<div class="collapse collapse-arrow bg-base-200">
								<input
									type="checkbox"
									checked={expandedPodcasts.has(podcast.id)}
									on:change={(e) => handlePodcastExpand(podcast.id, e.currentTarget.checked)}
								/>
								<div class="collapse-title">
									<div class="flex h-24 min-w-0 flex-1 gap-4">
										<img
											src={podcast.imageUrl}
											alt={podcast.title}
											class="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
										/>
										<div class="min-w-0">
											<h3 class="text-lg font-bold text-base-content">{podcast.title}</h3>
											<p class="text-base-content-secondary line-clamp-2">{podcast.description}</p>
										</div>
									</div>
								</div>
								<div class="collapse-content">
									<div class="mt-4 space-y-2">
										<h4 class="font-medium">Episodes:</h4>
										<div class="relative">
											<div class="max-h-96 space-y-2 overflow-y-auto pl-1 pr-2 mr-[-8px]">
												{#each podcast.items as episode}
													<button
														class={getEpisodeClasses(episode, podcast)}
														on:click={() => playPodcast(podcast, episode)}
													>
														<div class="flex justify-between">
															<span class="font-medium">{episode.title}</span>
															<span class="text-base-content-secondary text-sm"
																>{episode.duration}</span
															>
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
							</div>
						</div>
					{/each}
				{:else}
					<p class="text-base-content-secondary">Loading podcasts...</p>
				{/if}
			</div>
		</section>
	</div>
</main>
