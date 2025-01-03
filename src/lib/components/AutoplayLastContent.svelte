<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import radioProgress from '$lib/stores/radioProgress';
	import podcastProgress from '$lib/stores/podcastProgress';
	import { playerStore, playRadio, playPodcast } from '$lib/stores/player';
	import { fetchRadios } from '$lib/util/fetchRadios';
	import { fetchPodcastsFromRssFeeds } from '$lib/util/fetchPodcasts';
	import type { Podcast, Episode } from '$lib/util/fetchPodcasts';

	async function requestAutoplayPermission() {
		try {
			// Try to play a silent audio to request permission
			const audio = new Audio();
			audio.src =
				'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
			await audio.play();
			audio.remove();
			return true;
		} catch (error) {
			console.log('Autoplay permission denied');
			return false;
		}
	}

	async function setupLastContent() {
		if (!$settings.autoplayLastContent) return;

		// Request autoplay permission
		const hasPermission = await requestAutoplayPermission();
		if (!hasPermission) {
			console.log('Autoplay permission denied, content will be loaded but not played');
			return;
		}

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
				const radios = await fetchRadios();
				const radio = radios.find((r) => r.id === lastPlayedRadio.id);
				if (radio) playRadio(radio);
			} else {
				const podcasts = await fetchPodcastsFromRssFeeds();
				const podcast = podcasts.find((p: Podcast) => p.id === lastPlayedPodcast.id);
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
			const radios = await fetchRadios();
			const radio = radios.find((r) => r.id === lastPlayedRadio.id);
			if (radio) playRadio(radio);
			return;
		}

		// If only podcast exists
		if (lastPlayedPodcast) {
			const podcasts = await fetchPodcastsFromRssFeeds();
			const podcast = podcasts.find((p: Podcast) => p.id === lastPlayedPodcast.id);
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
