<script lang="ts">
	import PodcastCard from '$lib/components/PodcastCard.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import { settings } from '$lib/stores/settings';
	import { favorites } from '$lib/stores/favorites';
	import { radios } from '$lib/stores/radios';
	import DropdownSelect from '$lib/components/DropdownSelect.svelte';
	import { config } from '$lib/config';
	import { togglePlaylist } from '$lib/stores/player';
	import { podcasts, type Podcast } from '$lib/stores/podcasts';

	let expandedPodcasts = new Set<string>();
	let headerClasses = 'mb-2 sm:mb-4';
	let headerTextClasses = 'text-2xl font-bold';
	let sectionClasses = 'grid grid-cols-1 items-start gap-2 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3';
	let filteredPodcasts: Podcast[] = [];

	$: {
		filteredPodcasts = $podcasts.filter((podcast) => !$favorites.podcasts.has(podcast.id));
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
			$podcasts.flatMap((p) =>
				p.categories.filter((cat) => !config.podcast.bypassCategories.includes(cat))
			)
		)
	].sort();
	$: categoryOptions = allCategories.map((cat) => ({ value: cat, label: cat }));
	$: favoriteRadios = $radios.filter((radio) => $favorites.radios.has(radio.title));
	$: otherRadios = $radios.filter((radio) => !$favorites.radios.has(radio.title));
	$: favoritePodcasts = $podcasts.filter((podcast) => $favorites.podcasts.has(podcast.id));
	$: otherPodcasts = filteredPodcasts;

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
			// Use togglePlaylist for scrolling
			togglePlaylist(podcastId);
		} else {
			expandedPodcasts.delete(podcastId);
		}
		expandedPodcasts = expandedPodcasts; // Trigger reactivity
	}
</script>

{#if favoriteRadios.length > 0 || favoritePodcasts.length > 0}
	<h2 class={[headerClasses, headerTextClasses]}>Favorites</h2>
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
	<div class="divider"></div>
{/if}

<h2 class={[headerClasses, headerTextClasses]}>Radio</h2>
<div class={sectionClasses}>
	{#if $radios.length === 0}
		<p class="text-base-content-secondary">Loading stations...</p>
	{:else if otherRadios.length === 0}
		<p class="text-base-content-secondary">All stations are in favorites</p>
	{:else}
		{#each otherRadios as radio (radio.title)}
			<RadioCard {radio} />
		{/each}
	{/if}
</div>

<div class="divider"></div>

<div class="flex items-start items-center justify-between {headerClasses}">
	<h2 class={[headerTextClasses]}>Archive</h2>
	<DropdownSelect
		bind:value={$settings.selectedCategory}
		options={categoryOptions}
		backgroundColor="bg-base-200"
	/>
</div>
<div class={sectionClasses}>
	{#if $podcasts.length === 0}
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
