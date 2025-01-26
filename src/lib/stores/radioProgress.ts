import { getUserData, setUserData } from '$lib/util/userData';
import { writable } from 'svelte/store';

export interface RadioProgress {
	[radioId: string]: {
		lastPlayed: number; // Unix timestamp
	};
}

const radioProgress = writable<RadioProgress>(getUserData('radio-progress'));

radioProgress.subscribe((value) => {
	setUserData('radio-progress', value);
});

export const updateRadioProgress = (radioId: string) => {
	radioProgress.update((progress) => ({
		...progress,
		[radioId]: {
			lastPlayed: Date.now()
		}
	}));
};

export default radioProgress;
