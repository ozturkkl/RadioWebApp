import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface Favorites {
    radios: Set<string>;
    podcasts: Set<string>;
}

function createFavoritesStore() {
    // Load initial state from localStorage only in browser environment
    const initialState: Favorites = {
        radios: new Set(browser ? JSON.parse(localStorage.getItem('favorite-radios') || '[]') : []),
        podcasts: new Set(browser ? JSON.parse(localStorage.getItem('favorite-podcasts') || '[]') : [])
    };

    const { subscribe, update } = writable<Favorites>(initialState);

    return {
        subscribe,
        toggleRadio: (radioTitle: string) => {
            update(state => {
                const newRadios = new Set(state.radios);
                if (newRadios.has(radioTitle)) {
                    newRadios.delete(radioTitle);
                } else {
                    newRadios.add(radioTitle);
                }
                if (browser) {
                    localStorage.setItem('favorite-radios', JSON.stringify([...newRadios]));
                }
                return { ...state, radios: newRadios };
            });
        },
        togglePodcast: (podcastId: string) => {
            update(state => {
                const newPodcasts = new Set(state.podcasts);
                if (newPodcasts.has(podcastId)) {
                    newPodcasts.delete(podcastId);
                } else {
                    newPodcasts.add(podcastId);
                }
                if (browser) {
                    localStorage.setItem('favorite-podcasts', JSON.stringify([...newPodcasts]));
                }
                return { ...state, podcasts: newPodcasts };
            });
        }
    };
}

export const favorites = createFavoritesStore(); 