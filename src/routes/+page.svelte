<script lang="ts">
	import PodcastCard from '$lib/components/PodcastCard.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import SkeletonCard from '$lib/components/SkeletonCard.svelte';
	import { settings } from '$lib/stores/settings';
	import { radioFavorites } from '$lib/stores/radio/radioFavorites';
	import { podcastFavorites } from '$lib/stores/podcast/podcastFavorites';
	import DropdownSelect from '$lib/components/DropdownSelect.svelte';
	import { config } from '$lib/config';
	import { togglePlaylist } from '$lib/stores/player';
	import { radios } from '$lib/stores/radio/radios';
	import { podcasts, type Podcast } from '$lib/stores/podcast/podcasts';
	import { t } from '$lib/i18n';

	let expandedPodcasts = new Set<string>();
	let headerClasses = 'mb-2 sm:mb-4';
	let headerTextClasses = 'text-2xl font-bold';
	let sectionClasses = 'grid grid-cols-1 items-start gap-2 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3';
	let filteredPodcasts: Podcast[] = [];
	const ALL_CATEGORY = 'All'; // Keep this as a constant for comparison

	// Create a locale-aware sorter based on the current language
	$: localeSorter = new Intl.Collator($settings.language, { sensitivity: 'base' });

	$: {
		filteredPodcasts = $podcasts.filter((podcast) => !$podcastFavorites[podcast.id]);
		if (selectedCategory !== ALL_CATEGORY) {
			filteredPodcasts = filteredPodcasts.filter((podcast) => {
				return podcast.categories.includes(selectedCategory);
			});
		}
	}

	$: selectedCategory = $settings.selectedCategory;
	$: categoryList = [
		...new Set(
			$podcasts.flatMap((p) =>
				p.categories.filter((cat) => !config.podcast.bypassCategories.includes(cat))
			)
		)
	].sort((a, b) => localeSorter.compare(a, b));
	$: categoryOptions = [
		{ value: ALL_CATEGORY, label: $t.home.allCategories },
		...categoryList.map((cat) => ({ value: cat, label: cat }))
	];
	$: favoriteRadios = $radios.filter((radio) => !!$radioFavorites[radio.title]);
	$: otherRadios = $radios.filter((radio) => !$radioFavorites[radio.title]);
	$: favoritePodcasts = $podcasts.filter((podcast) => !!$podcastFavorites[podcast.id]);
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
	<h2 class={[headerClasses, headerTextClasses]}>{$t.home.favorites}</h2>
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

<h2 class={[headerClasses, headerTextClasses]}>{$t.home.radio}</h2>
<div class={sectionClasses}>
	{#if $radios.length === 0}
		{#each Array(4) as _}
			<SkeletonCard />
		{/each}
	{:else if otherRadios.length === 0}
		<p class="text-base-content-secondary">{$t.home.allStationsInFavorites}</p>
	{:else}
		{#each otherRadios as radio (radio.title)}
			<RadioCard {radio} />
		{/each}
	{/if}
</div>

<div class="divider"></div>

<div class="flex items-start items-center justify-between {headerClasses}">
	<h2 class={[headerTextClasses]}>{$t.home.archive}</h2>
	<DropdownSelect
		value={$settings.selectedCategory}
		onChange={(value) => settings.updateSettings({ selectedCategory: value })}
		options={categoryOptions}
		backgroundColor="bg-base-200"
		specialFirstOption={true}
	/>
</div>
<div class={sectionClasses}>
	{#if $podcasts.length === 0}
		{#each Array(6) as _}
			<SkeletonCard />
		{/each}
	{:else if otherPodcasts.length === 0}
		<p class="text-base-content-secondary">{$t.home.allArchiveInFavorites}</p>
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
