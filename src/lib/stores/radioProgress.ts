import { refreshStoreAfterGoogleFetch } from '$lib/util/googleDriveHelpers';
import { getUserData, setUserData } from '$lib/util/userData';
import { writable } from 'svelte/store';

export interface RadioProgress {
	[radioId: string]: {
		lastPlayed: number; // Unix timestamp
	};
}

function createRadioProgressStore() {
	const initialState: RadioProgress = getUserData('radio-progress');

	const { subscribe, update } = writable<RadioProgress>(initialState);

	subscribe((value) => {
		setUserData('radio-progress', value);
	});

	refreshStoreAfterGoogleFetch('radio-progress', update);

	const updateRadioProgress = (radioId: string) => {
		update((progress) => ({
			...progress,
			[radioId]: {
				lastPlayed: Date.now()
			}
		}));
	};

	function removeRadioProgress(radioId: string) {
		update((progress) => {
			const newProgress = { ...progress };
			delete newProgress[radioId];
			return newProgress;
		});
	}

	return {
		subscribe,
		updateRadioProgress,
		removeRadioProgress
	};
}

export const radioProgress = createRadioProgressStore();
