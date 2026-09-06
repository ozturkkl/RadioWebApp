<script lang="ts">
	import Modal from '$lib/components/modals/Modal.svelte';
	import { podcastProgress } from '$lib/stores/podcast/podcastProgress';
	import type { Podcast } from '$lib/stores/podcast/podcasts';
	import { t } from '$lib/i18n';

	export let podcast: Podcast;
	let modalComponent: Modal;

	$: modalId = `podcast_info_modal_${podcast.id}`;

	export function open() {
		if (modalComponent) {
			modalComponent.open();
		}
	}

	export function close() {
		if (modalComponent) {
			modalComponent.close();
		}
	}

	function timePassedSince(date: Date) {
		const diff = new Date().getTime() - date.getTime();
		const diffMinutes = Math.floor(diff / (1000 * 60));
		const diffHours = Math.floor(diff / (1000 * 60 * 60));
		const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (diffDays === 0 && diffHours === 0 && diffMinutes < 2) {
			return $t.podcast.justNow;
		}
		return diffDays > 0 
			? `${diffDays}${$t.podcast.timeUnits.days}` 
			: diffHours > 0 
				? `${diffHours}${$t.podcast.timeUnits.hours}` 
				: `${diffMinutes}${$t.podcast.timeUnits.minutes} ${$t.podcast.timeAgo}`;
	}

	$: progress = $podcastProgress[podcast.id];
	$: currentEpisode = progress ? podcast.items.find((ep) => ep.id === progress.episodeId) : null;
	$: currentEpisodeIndex = currentEpisode
		? podcast.items.findIndex((ep) => ep.id === currentEpisode.id)
		: -1;
	$: currentEpisodeProgress = currentEpisode?.duration
		? Math.round(((progress?.timestamp || 0) / Number(currentEpisode.duration)) * 100)
		: 0;
	$: completionPercentage =
		currentEpisodeIndex >= 0
			? Math.round(
					(currentEpisodeIndex * 100 +
						(currentEpisode?.duration
							? ((progress?.timestamp || 0) / Number(currentEpisode.duration)) * 100
							: 0)) /
						podcast.items.length
				)
			: 0;
	$: episodeCount = podcast.items.length;
	$: refreshed = timePassedSince(new Date(podcast.lastFetched));
</script>

<Modal id={modalId} bind:this={modalComponent} maxWidth="42rem">
	<div class="flex flex-col gap-4 overflow-hidden p-4 sm:flex-row sm:gap-6 sm:p-6">
		<div class="flex flex-none flex-row gap-4 sm:flex-col">
			<img
				src={podcast.imageUrl}
				alt={podcast.title}
				class="mx-auto h-32 w-32 rounded-lg object-cover shadow-lg sm:h-40 sm:w-40"
			/>
		</div>
		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			<h3 class="mt-[-4px] pr-8 text-2xl font-bold">{podcast.title}</h3>
			<div class="mt-3 flex flex-row flex-wrap gap-3 text-sm">
				<div class="flex items-center gap-1">
					<span class="text-base-content/70">{$t.podcast.episodes}:</span>
					<span class="font-medium">{episodeCount}</span>
				</div>
				<div class="flex items-center gap-1">
					<span class="text-base-content/70">{$t.podcast.refreshed}:</span>
					<span class="font-medium">{refreshed}</span>
				</div>
				<div class="flex items-center gap-1">
					<span class="text-base-content/70">{$t.podcast.overallProgress}:</span>
					<span class="font-medium">{completionPercentage}%</span>
				</div>
			</div>
			<div class="divider my-2"></div>
			<div class="prose-sm prose min-h-0 flex-1 overflow-y-auto">
				<p class="text-base-content/80">{podcast.description}</p>
			</div>
			{#if currentEpisode}
				<div class="divider my-2"></div>
				<div class="text-sm">
					<span class="text-base-content/70"
						>{$t.podcast.currentEpisode} ({currentEpisodeIndex + 1}/{episodeCount}):</span
					>
					<div class="group mt-2 overflow-hidden rounded bg-base-200 hover:bg-base-200/80">
						<div class="relative">
							<div
								class="absolute inset-0 bg-primary opacity-30 transition-all duration-300 ease-out group-hover:brightness-110"
								style="clip-path: polygon(0 0, {currentEpisodeProgress}% 0, {currentEpisodeProgress}% 100%, 0 100%)"
							></div>
							<p class="relative z-10 p-2 pr-10 font-medium">
								{currentEpisode.title}
								<span
									class="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-50 transition-opacity group-hover:opacity-100"
								>
									{currentEpisodeProgress}%
								</span>
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</Modal>
