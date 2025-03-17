import { writable } from 'svelte/store';
import { getUserData, setUserData } from '$lib/util/userData';
import { refreshStoreAfterGoogleFetch } from '$lib/util/googleDriveHelpers';

export interface PodcastFavorites {
	[podcastId: string]: boolean;
}

function createPodcastFavoritesStore() {
	const initialState: PodcastFavorites = getUserData('favorite-podcasts');

	const { subscribe, update } = writable<PodcastFavorites>(initialState);

	subscribe((value) => {
		setUserData('favorite-podcasts', value);
	});

	refreshStoreAfterGoogleFetch('favorite-podcasts', update);

	const togglePodcast = (podcastId: string) => {
		update((state) => {
			const newState = { ...state };
			if (newState[podcastId]) {
				delete newState[podcastId];
			} else {
				newState[podcastId] = true;
			}
			return newState;
		});
	};

	return {
		subscribe,
		togglePodcast
	};
}

export const podcastFavorites = createPodcastFavoritesStore();
