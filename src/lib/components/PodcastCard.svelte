<script lang="ts">
	import type { Podcast, Episode } from '$lib/util/fetchPodcasts';
	import { favorites } from '$lib/stores/favorites';
	import { playPodcast } from '$lib/stores/player';
	import { playerStore } from '$lib/stores/player';

	export let podcast: Podcast;
	export let expanded = false;
	export let onExpand: (podcastId: string, isExpanded: boolean) => void;

	function getEpisodeClasses(episode: Episode, podcast: Podcast) {
		const isActive =
			$playerStore.type === 'podcast' &&
			$playerStore.currentEpisode?.id === episode.id &&
			$playerStore.currentPodcast?.id === podcast.id;
		const baseClasses =
			'w-full rounded-lg border border-base-300 p-2 text-left shadow hover:shadow-xl';
		return `${baseClasses} ${isActive ? 'bg-base-300 shadow-xl outline outline-2 outline-offset-1 outline-primary' : 'bg-base-100 hover:bg-base-300'}`;
	}
</script>

<div
	class="podcast-item relative w-full rounded-lg border bg-base-200 transition-all {!expanded
		? 'hover:scale-[1.02]'
		: ''} shadow hover:shadow-xl"
	data-podcast-id={podcast.id}
>
	<button
		class="absolute left-0 top-0 z-10 rounded-lg bg-base-100/50 p-1 hover:bg-base-100"
		style="border-top-right-radius: 0; border-bottom-right-radius: 10px; border-bottom-left-radius: 0px;"
		on:click|stopPropagation={() => favorites.togglePodcast(podcast.id)}
		aria-label={$favorites.podcasts.has(podcast.id) ? 'Remove from favorites' : 'Add to favorites'}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 fill-current {$favorites.podcasts.has(podcast.id)
				? 'text-yellow-400'
				: 'text-base-content/50 hover:text-yellow-400'}"
			viewBox="0 0 20 20"
		>
			<path
				d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
			/>
		</svg>
	</button>
	<div class="collapse collapse-arrow rounded-lg bg-base-200">
		<input
			type="checkbox"
			checked={expanded}
			on:change={(e) => onExpand(podcast.id, e.currentTarget.checked)}
		/>
		<div class="collapse-title p-0">
			<div class="flex h-24 min-w-0 flex-1 gap-2 sm:gap-4">
				<img src={podcast.imageUrl} alt={podcast.title} class="h-24 w-24 rounded-lg object-cover" />
				<div class="w-0 flex-1">
					<h3 class="truncate pr-5 text-lg font-bold text-base-content">
						{podcast.title}
					</h3>
					<p class="text-base-content-secondary line-clamp-2 pr-2">
						{podcast.description}
					</p>
				</div>
			</div>
		</div>
		<div class="collapse-content relative">
			<div
				class="-mx-3 flex max-h-96 flex-col gap-1 overflow-y-auto border-t border-base-300 p-1 pt-3"
			>
				{#each podcast.items as episode}
					<button
						class={getEpisodeClasses(episode, podcast)}
						on:click={() => playPodcast(podcast, episode)}
					>
						<div class="flex justify-between">
							<span class="font-medium">{episode.title}</span>
							<span class="text-base-content-secondary text-sm">{episode.duration}</span>
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
