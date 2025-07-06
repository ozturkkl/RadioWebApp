<script lang="ts">
	import { playerStore } from '$lib/stores/player';
	import { onMount } from 'svelte';
	import TouchableButton from '$lib/components/utility/TouchableButton.svelte';
	import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-svelte';
	import { type Episode, type Podcast, podcasts } from '$lib/stores/podcast/podcasts';
	import { type Radio, radios } from '$lib/stores/radio/radios';
	import { podcastProgress } from '$lib/stores/podcast/podcastProgress';
	import { radioProgress } from '$lib/stores/radio/radioProgress';
	import { t } from '$lib/i18n';
	import { isTouchDevice } from '$lib/util/browserUtils';

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
	let scrollTo = 0;
	let longPressTimeout: NodeJS.Timeout;
	let isEditMode = false;
	let componentRoot: HTMLElement;

	$: {
		if (scrollTo < 0) {
			scrollTo = 0;
		} else if (scrollTo > scrollContainer?.scrollWidth - scrollContainer?.clientWidth) {
			scrollTo = scrollContainer?.scrollWidth - scrollContainer?.clientWidth;
		}
		scrollContainer?.scrollTo({ left: scrollTo, behavior: 'smooth' });
	}

	onMount(() => {
		setTimeout(onScroll, 100);
		window.addEventListener('resize', onScroll);
		window.addEventListener('pointerdown', handleOutsidePointer);
		return () => {
			window.removeEventListener('resize', onScroll);
			window.removeEventListener('pointerdown', handleOutsidePointer);
		};
	});

	function handleOutsidePointer(event: PointerEvent) {
		if (isEditMode) {
			const target = event.target as HTMLElement;
			if (!componentRoot.contains(target)) {
				isEditMode = false;
			}
		}
	}

	function onScroll(e: Event) {
		if (!scrollContainer) return;
		if (isTouchDevice()) {
			showLeftArrow = false;
			showRightArrow = false;
			return;
		}
		showLeftArrow = scrollContainer.scrollLeft > 10;
		showRightArrow =
			scrollContainer.scrollLeft < scrollContainer.scrollWidth - scrollContainer.clientWidth - 10;
	}

	function onMouseWheel(e: WheelEvent) {
		e.preventDefault();
		e.stopPropagation();
		scrollTo += e.deltaY;
	}

	function scroll(direction: 'left' | 'right') {
		if (!scrollContainer) return;
		const scrollAmount = direction === 'left' ? -200 : 200;
		scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
	}

	function handlePointerDown(item: ContinueListeningItem, event: PointerEvent) {
		longPressTimeout = setTimeout(() => {
			isEditMode = true;
		}, 500);
	}

	function handlePointerUp() {
		if (!isEditMode) {
			clearTimeout(longPressTimeout);
		}
	}

	function handlePointerLeave() {
		if (!isEditMode) {
			clearTimeout(longPressTimeout);
		}
	}

	function handleDelete(item: ContinueListeningItem) {
		if (item.type === 'podcast') {
			podcastProgress.removePodcastProgress(item.item.id);
		} else {
			radioProgress.removeRadioProgress(item.item.id);
		}
	}

	$: {
		const podcastItems = $podcasts
			.filter((p) => $podcastProgress[p.id])
			.map((p) => ({
				type: 'podcast' as const,
				item: {
					...p,
					episodeId: $podcastProgress[p.id].episodeId,
					timestamp: $podcastProgress[p.id].timestamp
				},
				lastPlayed: $podcastProgress[p.id].lastPlayed
			}));

		const radioItems = $radios
			.filter((r) => $radioProgress[r.id])
			.map((r) => ({
				type: 'radio' as const,
				item: r,
				lastPlayed: $radioProgress[r.id].lastPlayed
			}));

		continueListeningItems = [...podcastItems, ...radioItems].sort((a, b) => {
			return b.lastPlayed - a.lastPlayed;
		});

		setTimeout(onScroll, 0);
	}

	function handleItemClick(item: ContinueListeningItem) {
		if (isEditMode) {
			return;
		}
		if (item.type === 'podcast') {
			const episode = item.item.items.find((ep: Episode) => ep.id === item.item.episodeId);
			if (episode) {
				playerStore.playPodcast(item.item, episode, item.item.timestamp);
			}
		} else {
			playerStore.playRadio(item.item);
		}
	}
	function handleItemKeyDown(item: ContinueListeningItem, event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			handleItemClick(item);
		}
		if (event.key === 'Delete') {
			handleDelete(item);
		}
		if (event.key === 'Escape') {
			isEditMode = false;
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
	<div
		bind:this={componentRoot}
		class="relative w-full overflow-hidden border-b-2 border-base-content/10"
	>
		{#if showLeftArrow}
			<div class="absolute left-[.2rem] top-1/2 z-10 -translate-y-1/2">
				<TouchableButton onClick={() => scroll('left')} ariaLabel={$t.continueListening.scrollLeft}>
					<ChevronLeft class="h-5 w-5" />
				</TouchableButton>
			</div>
		{/if}
		{#if showRightArrow}
			<div class="absolute right-[.2rem] top-1/2 z-10 -translate-y-1/2">
				<TouchableButton
					onClick={() => scroll('right')}
					ariaLabel={$t.continueListening.scrollRight}
				>
					<ChevronRight class="h-5 w-5" />
				</TouchableButton>
			</div>
		{/if}

		<div
			bind:this={scrollContainer}
			on:scroll={onScroll}
			on:wheel={onMouseWheel}
			class="no-scrollbar flex gap-1 overflow-x-auto p-2"
		>
			{#each continueListeningItems as item, index}
				<div
					role="button"
					tabindex="0"
					class="continue-listening-item hover:brightness-120 group flex min-w-fit items-center rounded-full border-2 border-base-content/20 bg-accent/15 p-0 transition-colors
                    transition-transform hover:scale-105 {isEditMode
						? 'animate-bounce-subtle'
						: ''}"
					on:click={(e) => handleItemClick(item)}
					on:keydown={(e) => handleItemKeyDown(item, e)}
					on:pointerdown={(e) => handlePointerDown(item, e)}
					on:pointerup={handlePointerUp}
					on:pointerleave={handlePointerLeave}
					on:contextmenu={(e) => e.preventDefault()}
				>
					<img
						src={item.type === 'podcast' ? item.item.imageUrl : item.item.image}
						alt={item.item.title}
						class="h-12 w-12 flex-shrink-0 rounded-full"
					/>
					{#if item.type === 'podcast' && !isEditMode}
						<div class="flex flex-col pl-[.2rem] pr-2 text-xs">
							<span class="whitespace-nowrap">{getEpisodeNumber(item.item)}</span>
							<span class="whitespace-nowrap">{getCompletionPercentage(item.item)}%</span>
						</div>
					{:else if isEditMode}
						<button
							class="flex items-center pl-[.2rem] pr-2 text-error"
							on:click={(e) => handleDelete(item)}
						>
							<Trash2 class="h-6 w-6" />
						</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	@keyframes bounce-subtle {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-2px);
		}
	}
	.animate-bounce-subtle {
		animation: bounce-subtle 500ms ease-in-out infinite;
	}
</style>
