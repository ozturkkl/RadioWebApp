<script lang="ts">
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import PodcastCard from '$lib/components/PodcastCard.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import ContinueListening from '$lib/components/ContinueListening.svelte';
	import { onMount } from 'svelte';
	import { fetchPodcastsFromRssFeeds } from '$lib/util/fetchPodcasts';
	import { fetchRadios } from '$lib/util/fetchRadios';
	import type { Radio } from '$lib/util/fetchRadios';
	import type { Podcast } from '$lib/util/fetchPodcasts';
	import { settings } from '$lib/stores/settings';
	import { favorites } from '$lib/stores/favorites';
	import DropdownSelect from '$lib/components/DropdownSelect.svelte';
	import { config } from '$lib/config';

	let podcasts: Podcast[] = [];
	let radios: Radio[] = [];
	let expandedPodcasts = new Set<string>();
	let headerClasses = 'mb-2 text-2xl font-bold sm:mb-4';
	let sectionClasses = 'grid grid-cols-1 items-start gap-2 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3';
	let filteredPodcasts: Podcast[] = [];

	$: {
		filteredPodcasts = podcasts.filter((podcast) => !$favorites.podcasts.has(podcast.id));
		if (selectedCategory !== 'All') {
			filteredPodcasts = filteredPodcasts.filter((podcast) => {
				return podcast.categories.includes(selectedCategory);
			});
		}
	}

	$: selectedCategory = $settings.selectedCategory;
	$: allCategories = [
		'All',
		...new Set(
			podcasts.flatMap((p) =>
				p.categories.filter((cat) => !config.podcast.bypassCategories.includes(cat))
			)
		)
	].sort();
	$: categoryOptions = allCategories.map((cat) => ({ value: cat, label: cat }));
	$: favoriteRadios = radios.filter((radio) => $favorites.radios.has(radio.title));
	$: otherRadios = radios.filter((radio) => !$favorites.radios.has(radio.title));
	$: favoritePodcasts = podcasts.filter((podcast) => $favorites.podcasts.has(podcast.id));
	$: otherPodcasts = filteredPodcasts;

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
		expandedPodcasts = expandedPodcasts; // Trigger reactivity
	}
</script>

<main class="container mx-auto space-y-1 px-1 py-2 sm:space-y-2 sm:px-4 sm:py-3">
	<ContinueListening {podcasts} />

	{#if favoriteRadios.length > 0 || favoritePodcasts.length > 0}
		<section>
			<h2 class={headerClasses}>Favorites</h2>
			<div class={sectionClasses}>
				{#each favoriteRadios as radio (radio.title)}
					<RadioCard {radio} />
				{/each}
				{#each favoritePodcasts as podcast (podcast.id)}
					<PodcastCard
						{podcast}
						expanded={expandedPodcasts.has(podcast.id)}
						onExpand={handlePodcastExpand}
					/>
				{/each}
			</div>
		</section>
		<div class="divider"></div>
	{/if}

	<section>
		<h2 class={headerClasses}>Radio</h2>
		<div class={sectionClasses}>
			{#if radios.length === 0}
				<p class="text-base-content-secondary">Loading stations...</p>
			{:else if otherRadios.length === 0}
				<p class="text-base-content-secondary">All stations are in favorites</p>
			{:else}
				{#each otherRadios as radio (radio.title)}
					<RadioCard {radio} />
				{/each}
			{/if}
		</div>
	</section>

	<div class="divider"></div>

	<section>
		<div class="flex items-start items-center justify-between {headerClasses}">
			<h2>Archive</h2>
			<DropdownSelect
				bind:value={$settings.selectedCategory}
				options={categoryOptions}
				classes="bg-base-200 w-48 sm:w-64 border border-1 border-base-300"
			/>
		</div>
		<div class={sectionClasses}>
			{#if podcasts.length === 0}
				<p class="text-base-content-secondary">Loading archive...</p>
			{:else if otherPodcasts.length === 0}
				<p class="text-base-content-secondary">All of this archive is in favorites</p>
			{:else}
				{#each otherPodcasts as podcast (podcast.id)}
					<PodcastCard
						{podcast}
						expanded={expandedPodcasts.has(podcast.id)}
						onExpand={handlePodcastExpand}
					/>
				{/each}
			{/if}
		</div>
	</section>
</main>
