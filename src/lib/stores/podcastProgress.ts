import { refreshStoreAfterGoogleFetch } from '$lib/util/googleDriveHelpers';
import { throttleDebounce } from '$lib/util/throttleDebounce';
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

function createPodcastProgressStore() {
	const initialState: PodcastProgress = getUserData('podcast-progress');

	const { subscribe, update } = writable<PodcastProgress>(initialState);

	subscribe((value) => {
		setUserData('podcast-progress', value);
	});

	refreshStoreAfterGoogleFetch('podcast-progress', update);

	const updatePodcastProgress = throttleDebounce(
		(podcastId: string, episodeId: string, timestamp: number) => {
			update((progress) => ({
				...progress,
				[podcastId]: {
					episodeId,
					timestamp,
					lastPlayed: Date.now()
				}
			}));
		},
		1000,
		true,
		true
	);

	function removePodcastProgress(podcastId: string) {
		update((progress) => {
			const newProgress = { ...progress };
			delete newProgress[podcastId];
			return newProgress;
		});
	}

	return {
		subscribe,
		updatePodcastProgress,
		removePodcastProgress
	};
}

export const podcastProgress = createPodcastProgressStore();
