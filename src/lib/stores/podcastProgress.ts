import { getUserData, setUserData } from '$lib/util/userData';
import { writable } from 'svelte/store';

interface EpisodeProgress {
	episodeId: string;
	timestamp: number;
	lastPlayed: number; // Unix timestamp
}

export interface PodcastProgress {
	[podcastId: string]: EpisodeProgress;
}

const podcastProgress = writable<PodcastProgress>(getUserData('podcast-progress'));

podcastProgress.subscribe((value) => {
	setUserData('podcast-progress', value);
});

export const updatePodcastProgress = (podcastId: string, episodeId: string, timestamp: number) => {
	podcastProgress.update((progress) => ({
		...progress,
		[podcastId]: {
			episodeId,
			timestamp,
			lastPlayed: Date.now()
		}
	}));
};

export default podcastProgress;
