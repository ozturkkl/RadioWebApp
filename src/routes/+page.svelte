<script lang="ts">
	import PodcastCard from '$lib/components/PodcastCard.svelte';
	import RadioCard from '$lib/components/RadioCard.svelte';
	import SkeletonCard from '$lib/components/SkeletonCard.svelte';
	import { settings } from '$lib/stores/settings';
	import { radioFavorites } from '$lib/stores/radio/radioFavorites';
	import { podcastFavorites } from '$lib/stores/podcast/podcastFavorites';
	import DropdownSelect from '$lib/components/utility/DropdownSelect.svelte';
	import { config } from '$lib/config';
	import { togglePlaylist } from '$lib/stores/player';
	import { radios } from '$lib/stores/radio/radios';
	import { podcasts, type Podcast } from '$lib/stores/podcast/podcasts';
	import { t } from '$lib/i18n';
	import { playerStore } from '$lib/stores/player';
	import { onMount, tick } from 'svelte';
	import { get } from 'svelte/store';

	let expandedPodcasts = new Set<string>();
	let headerClasses = 'mb-2 sm:mb-4';
	let headerTextClasses = 'text-2xl font-bold';
	let sectionClasses = 'grid grid-cols-1 items-start gap-2 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3';
	let filteredPodcasts: Podcast[] = [];
	const ALL_CATEGORY = 'All'; // Keep this as a constant for comparison

	// Windowing/lightweight activation for archive podcasts
	let visibleStartIndex = 0;
	let visibleEndIndex = 0;
	const ACTIVE_BUFFER = 0; // render a small buffer around viewport for smoothness
	let intersectionObserver: IntersectionObserver;
	const visibleIndexSet = new Set<number>();

	// Map podcast id to index for O(1) lookup
	$: otherPodcastIdToIndex = new Map(otherPodcasts.map((p, i) => [p.id, i] as const));

	function updateVisibleRange() {
		if (visibleIndexSet.size === 0) return;
		let minIdx = Number.POSITIVE_INFINITY;
		let maxIdx = -1;
		for (const idx of visibleIndexSet) {
			if (idx < minIdx) minIdx = idx;
			if (idx > maxIdx) maxIdx = idx;
		}
		if (minIdx === Number.POSITIVE_INFINITY || maxIdx === -1) return;
		const newStart = Math.max(0, minIdx - ACTIVE_BUFFER);
		const newEnd = Math.min(otherPodcasts.length - 1, maxIdx + ACTIVE_BUFFER);
		if (newStart !== visibleStartIndex || newEnd !== visibleEndIndex) {
			visibleStartIndex = newStart;
			visibleEndIndex = newEnd;
		}
	}

	function setupIntersectionObserver() {
		if (intersectionObserver) {
			intersectionObserver.disconnect();
		}
		visibleIndexSet.clear();

		if (typeof window === 'undefined') return;

		const cards = document.querySelectorAll('.podcast-card[data-podcast-id]');
		const rootEl = cards[0]?.closest('.overflow-y-auto') as Element;

		if (!rootEl) return;

		intersectionObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const target = entry.target as HTMLElement;
					const id = target.getAttribute('data-podcast-id');
					if (!id) continue;
					const idx = otherPodcastIdToIndex.get(id);
					if (idx === undefined) continue;
					if (entry.isIntersecting) {
						visibleIndexSet.add(idx);
					} else {
						visibleIndexSet.delete(idx);
					}
				}
				updateVisibleRange();
			},
			{
				root: rootEl,
				rootMargin: '0px',
				threshold: 0
			}
		);

		cards.forEach((el) => intersectionObserver.observe(el));
	}

	onMount(() => {
		if (typeof window === 'undefined') return;
		return () => {
			intersectionObserver?.disconnect();
		};
	});

	$: otherPodcasts,
		(async () => {
			await tick();
			setupIntersectionObserver();
		})();

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
		{#each otherPodcasts as podcast, index (podcast.id)}
			<PodcastCard
				{podcast}
				expanded={expandedPodcasts.has(podcast.id)}
				active={expandedPodcasts.has(podcast.id) ||
					($playerStore.type === 'podcast' && $playerStore.currentPodcast?.id === podcast.id) ||
					(index >= visibleStartIndex && index <= visibleEndIndex)}
				onExpand={handlePodcastExpand}
			/>
		{/each}
	{/if}
</div>
