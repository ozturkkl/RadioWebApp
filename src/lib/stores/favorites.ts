import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getUserData, setUserData } from '$lib/util/userData';

interface Favorites {
	radios: Record<string, boolean>;
	podcasts: Record<string, boolean>;
}

function createFavoritesStore() {
	const initialState: Favorites = {
		radios: getUserData('favorite-radios'),
		podcasts: getUserData('favorite-podcasts')
	};

	const { subscribe, update } = writable<Favorites>(initialState);

	return {
		subscribe,
		toggleRadio: (radioTitle: string) => {
			update((state) => {
				const newRadios = { ...state.radios };
				if (newRadios[radioTitle]) {
					delete newRadios[radioTitle];
				} else {
					newRadios[radioTitle] = true;
				}
				if (browser) {
					setUserData('favorite-radios', newRadios);
				}
				return { ...state, radios: newRadios };
			});
		},
		togglePodcast: (podcastId: string) => {
			update((state) => {
				const newPodcasts = { ...state.podcasts };
				if (newPodcasts[podcastId]) {
					delete newPodcasts[podcastId];
				} else {
					newPodcasts[podcastId] = true;
				}
				if (browser) {
					setUserData('favorite-podcasts', newPodcasts);
				}
				return { ...state, podcasts: newPodcasts };
			});
		}
	};
}

export const favorites = createFavoritesStore();
