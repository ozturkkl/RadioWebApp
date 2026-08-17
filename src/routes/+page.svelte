<script lang="ts">
	import PodcastCard from '$lib/components/PodcastCard.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import SkeletonCard from '$lib/components/SkeletonCard.svelte';
	import { settings } from '$lib/stores/settings';
	import { radioFavorites } from '$lib/stores/radio/radioFavorites';
	import { podcastFavorites } from '$lib/stores/podcast/podcastFavorites';
	import DropdownSelect from '$lib/components/utility/DropdownSelect.svelte';
	import SearchInput from '$lib/components/utility/SearchInput.svelte';
	import { config } from '$lib/config';
	import { togglePlaylist } from '$lib/stores/player';
	import { radios, type Radio } from '$lib/stores/radio/radios';
	import { podcasts, type Podcast } from '$lib/stores/podcast/podcasts';
	import { t } from '$lib/i18n';
	import { playerStore } from '$lib/stores/player';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import VirtualList from '$lib/components/utility/VirtualList.svelte';
	import { searchPodcasts, type SearchHit } from '$lib/util/search';

	let expandedPodcasts = new Set<string>();
	let headerClasses = 'mb-2 sm:mb-4';
	let headerTextClasses = 'text-2xl font-bold';
	let sectionClasses = 'grid grid-cols-1 items-start gap-2 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3';
	let filteredPodcasts: Podcast[] = [];
	const ALL_CATEGORY = 'All'; // Keep this as a constant for comparison

	let searchQuery = '';
	let lastSearchKey = '';

	let sharedPodcastId: string | null = null;
	let sharedEpisodeId: string | null = null;
	let sharedRadioId: string | null = null;
	let sharedTimeSeconds = 0;
	let shareHandled = false;

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

	$: isSearching = searchQuery.trim().length > 0;
	$: categoryPodcasts =
		selectedCategory === ALL_CATEGORY
			? $podcasts
			: $podcasts.filter((podcast) => podcast.categories.includes(selectedCategory));
	$: searchHits = isSearching
		? searchPodcasts(categoryPodcasts, searchQuery)
		: [];
	$: searchHitById = new Map(searchHits.map((hit) => [hit.podcast.id, hit]));
	$: exactPodcasts = searchHits.filter((hit) => hit.matchKind === 'exact').map((hit) => hit.podcast);
	$: similarPodcasts = searchHits
		.filter((hit) => hit.matchKind === 'similar')
		.map((hit) => hit.podcast);
	$: archivePodcasts = isSearching ? searchHits.map((hit) => hit.podcast) : otherPodcasts;

	$: if (searchQuery !== lastSearchKey) {
		lastSearchKey = searchQuery;
		expandedPodcasts = new Set();
	}

	$: if (typeof window !== 'undefined') {
		void searchQuery;
		queueMicrotask(() => {
			const scroller = document.querySelector<HTMLElement>('.grow.overflow-y-auto');
			scroller?.scrollTo({ top: 0 });
		});
	}

	function handleSearchChange(value: string) {
		searchQuery = value;
	}

	function searchMatch(podcast: Podcast): SearchHit | undefined {
		return searchHitById.get(podcast.id);
	}

	function tryHandleShare() {
		if (sharedPodcastId) {
			const podcast = get(podcasts).find((p) => p.id === sharedPodcastId);
			if (podcast) {
				const episode = podcast.items.find(
					(e) => e.id === (sharedEpisodeId ?? podcast.items[0].id)
				);
				if (episode) {
					playerStore.playPodcast(podcast, episode, sharedTimeSeconds);
					togglePlaylist(sharedPodcastId);
					return true;
				}
			}
		} else if (sharedRadioId) {
			const radio = get(radios).find((r) => r.id === sharedRadioId);
			if (radio) {
				playerStore.playRadio(radio);
				togglePlaylist();
				return true;
			}
		}

		return false;
	}

	onMount(() => {
		if (typeof window === 'undefined') return;

		const url = new URL(window.location.href);
		sharedPodcastId = url.searchParams.get('podcast');
		sharedEpisodeId = url.searchParams.get('episode');
		sharedRadioId = url.searchParams.get('radio');
		const timeParam = url.searchParams.get('t');
		sharedTimeSeconds = timeParam ? parseInt(timeParam, 10) || 0 : 0;

		if (!sharedPodcastId && !sharedRadioId) {
			shareHandled = true;
			return;
		}

		shareHandled = tryHandleShare();
	});

	$: if (
		!shareHandled &&
		typeof window !== 'undefined' &&
		((sharedPodcastId && $podcasts.length > 0) || (sharedRadioId && $radios.length > 0))
	) {
		shareHandled = tryHandleShare();
	}

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

{#if !isSearching}
	{#if favoriteRadios.length > 0 || favoritePodcasts.length > 0}
		<h2 class={[headerClasses, headerTextClasses]}>{$t.home.favorites}</h2>
		<div class={sectionClasses}>
			{#each favoriteRadios as radio (radio.title)}
				<RadioCard {radio} />
			{/each}
			<VirtualList items={favoritePodcasts} estimatedItemHeight={97.5}>
				<svelte:fragment let:item>
					<PodcastCard
						podcast={item as Podcast}
						expanded={expandedPodcasts.has((item as Podcast).id)}
						onExpand={handlePodcastExpand}
					/>
				</svelte:fragment>
			</VirtualList>
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
			<VirtualList items={otherRadios} estimatedItemHeight={97.5}>
				<svelte:fragment let:item>
					<RadioCard radio={item as Radio} />
				</svelte:fragment>
			</VirtualList>
		{/if}
	</div>

	<div class="divider"></div>
{/if}

<h2 class="{headerTextClasses} mb-2">{$t.home.archive}</h2>
<div
	class="sticky top-0 z-30 -mx-3 flex items-center gap-2 bg-base-100/95 px-3 py-2 pb-3 backdrop-blur-sm sm:pb-4"
>
	<div class="min-w-0 flex-1">
		<SearchInput
			bind:value={searchQuery}
			placeholder={$t.home.searchPlaceholder}
			ariaLabel={$t.home.searchLabel}
			clearLabel={$t.home.searchClear}
			onChange={handleSearchChange}
		/>
	</div>
	<div class="shrink-0">
		<DropdownSelect
			value={$settings.selectedCategory}
			onChange={(value) => settings.updateSettings({ selectedCategory: value })}
			options={categoryOptions}
			backgroundColor="bg-base-200"
			specialFirstOption={true}
		/>
	</div>
</div>
{#snippet podcastGrid(items: Podcast[])}
	<div class={sectionClasses}>
		<VirtualList {items} estimatedItemHeight={97.5}>
			<svelte:fragment let:item>
				{@const podcast = item as Podcast}
				{@const hit = searchMatch(podcast)}
				<PodcastCard
					{podcast}
					expanded={expandedPodcasts.has(podcast.id)}
					onExpand={handlePodcastExpand}
					matchField={hit?.matchField}
					matchedEpisodeIds={hit?.matchedEpisodeIds}
					highlightQuery={isSearching ? searchQuery : ''}
				/>
			</svelte:fragment>
		</VirtualList>
	</div>
{/snippet}

{#if $podcasts.length === 0}
	<div class={sectionClasses}>
		{#each Array(6) as _}
			<SkeletonCard />
		{/each}
	</div>
{:else if isSearching}
	{#if archivePodcasts.length === 0}
		<p class="text-base-content-secondary">{$t.home.searchNoResults}</p>
	{:else}
		{#if exactPodcasts.length > 0}
			<h3 class="mb-2 text-lg font-semibold sm:mb-4">{$t.home.searchExactMatches}</h3>
			{@render podcastGrid(exactPodcasts)}
		{/if}
		{#if similarPodcasts.length > 0}
			{#if exactPodcasts.length > 0}
				<div class="divider"></div>
			{/if}
			<h3 class="mb-2 text-lg font-semibold sm:mb-4">{$t.home.searchSimilarMatches}</h3>
			{@render podcastGrid(similarPodcasts)}
		{/if}
	{/if}
{:else if archivePodcasts.length === 0}
	<p class="text-base-content-secondary">{$t.home.allArchiveInFavorites}</p>
{:else}
	{@render podcastGrid(archivePodcasts)}
{/if}
