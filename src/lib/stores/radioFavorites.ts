import { writable } from 'svelte/store';
import { getUserData, setUserData } from '$lib/util/userData';
import { refreshStoreAfterGoogleFetch } from '$lib/util/googleDriveHelpers';

export interface RadioFavorites {
	[radioTitle: string]: boolean;
}

function createRadioFavoritesStore() {
	const initialState: RadioFavorites = getUserData('favorite-radios');

	const { subscribe, update } = writable<RadioFavorites>(initialState);

	subscribe((value) => {
		setUserData('favorite-radios', value);
	});

	refreshStoreAfterGoogleFetch('favorite-radios', update);

	const toggleRadio = (radioTitle: string) => {
		update((state) => {
			const newState = { ...state };
			if (newState[radioTitle]) {
				delete newState[radioTitle];
			} else {
				newState[radioTitle] = true;
			}
			return newState;
		});
	};

	return {
		subscribe,
		toggleRadio
	};
}

export const radioFavorites = createRadioFavoritesStore();
