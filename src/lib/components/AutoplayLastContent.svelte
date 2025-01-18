<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import radioProgress from '$lib/stores/radioProgress';
	import podcastProgress from '$lib/stores/podcastProgress';
	import { playerStore, playRadio, playPodcast } from '$lib/stores/player';
	import { get } from 'svelte/store';
	import { radios } from '$lib/stores/radios';
	import { podcasts, type Episode, type Podcast } from '$lib/stores/podcasts';

	async function setupLastContent() {
		if (!$settings.autoplayLastContent) return;

		// Get the last played times for radios and podcasts
		const lastPlayedRadio = Object.entries($radioProgress).reduce(
			(latest, [id, progress]) => {
				if (!latest || progress.lastPlayed > latest.lastPlayed) {
					return { id, lastPlayed: progress.lastPlayed };
				}
				return latest;
			},
			null as { id: string; lastPlayed: number } | null
		);

		const lastPlayedPodcast = Object.entries($podcastProgress).reduce(
			(latest, [id, progress]) => {
				if (!latest || progress.lastPlayed > latest.lastPlayed) {
					return {
						id,
						lastPlayed: progress.lastPlayed,
						episodeId: progress.episodeId,
						timestamp: progress.timestamp
					};
				}
				return latest;
			},
			null as { id: string; lastPlayed: number; episodeId: string; timestamp: number } | null
		);

		// If neither exists, return
		if (!lastPlayedRadio && !lastPlayedPodcast) return;

		// If both exist, play the most recently played one
		if (lastPlayedRadio && lastPlayedPodcast) {
			if (lastPlayedRadio.lastPlayed > lastPlayedPodcast.lastPlayed) {
				const radio = await get(radios).find((r) => r.id === lastPlayedRadio.id);
				if (radio) playRadio(radio);
			} else {
				const podcast = await get(podcasts).find((p: Podcast) => p.id === lastPlayedPodcast.id);
				if (podcast) {
					const episode = podcast.items.find((e: Episode) => e.id === lastPlayedPodcast.episodeId);
					if (episode) {
						playPodcast(podcast, episode, lastPlayedPodcast.timestamp);
					}
				}
			}
			return;
		}

		// If only radio exists
		if (lastPlayedRadio) {
			const radio = await get(radios).find((r) => r.id === lastPlayedRadio.id);
			if (radio) playRadio(radio);
			return;
		}

		// If only podcast exists
		if (lastPlayedPodcast) {
			const podcast = await get(podcasts).find((p: Podcast) => p.id === lastPlayedPodcast.id);
			if (podcast) {
				const episode = podcast.items.find((e: Episode) => e.id === lastPlayedPodcast.episodeId);
				if (episode) {
					playPodcast(podcast, episode, lastPlayedPodcast.timestamp);
				}
			}
		}
	}

	onMount(() => {
		setupLastContent();
	});
</script>
