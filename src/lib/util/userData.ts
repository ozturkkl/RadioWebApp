import type { PodcastProgress } from '$lib/stores/podcast/podcastProgress';
import type { Settings } from '$lib/stores/settings';
import type { RadioProgress } from '$lib/stores/radio/radioProgress';
import { saveUserDataToGoogle } from '$lib/util/googleDriveHelpers';

export interface UserData {
	'favorite-radios': Record<string, boolean>;
	'favorite-podcasts': Record<string, boolean>;
	'podcast-progress': PodcastProgress;
	'radio-progress': RadioProgress;
	'app-settings': Settings;
}

export const userDataDefaults: UserData = {
	'favorite-radios': {},
	'favorite-podcasts': {},
	'podcast-progress': {},
	'radio-progress': {},
	'app-settings': {
		theme: 'system',
		language: 'tr',
		autoplay: true,
		autoCollapse: true,
		skipSeconds: 5,
		playbackRate: 1.0,
		volume: 1.0,
		muted: false,
		selectedCategory: 'All',
		autoplayLastContent: false
	}
};

export function getUserData<K extends keyof UserData>(key: K): UserData[K] {
	if (typeof window === 'undefined') {
		return userDataDefaults[key];
	}
	// console.log(`Getting user data - ${key}`);
	try {
		const data = localStorage.getItem(key);
		if (!data) return userDataDefaults[key];

		const parsedData = JSON.parse(data);

		// For objects, merge defaults with stored data to ensure new properties are included
		// while preserving user's existing settings
		if (typeof userDataDefaults[key] === 'object' && !Array.isArray(userDataDefaults[key])) {
			return { ...userDataDefaults[key], ...parsedData };
		}

		return parsedData;
	} catch (error) {
		console.error(`Error parsing user data for key ${key}:`, error);
		return userDataDefaults[key];
	}
}

export function setUserData<K extends keyof UserData>(
	key: K,
	data: UserData[K],
	saveToGoogle = true
) {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		const currentData = getUserData(key);
		if (JSON.stringify(currentData) === JSON.stringify(data)) return;
		// console.log(`Setting user data: ${saveToGoogle} - ${key} - ${JSON.stringify(data, null, 2)}`);
		localStorage.setItem(key, JSON.stringify(data));
		if (saveToGoogle) {
			saveUserDataToGoogle(key, data);
		}
	} catch (error) {
		console.error(`Error setting user data for key ${key}:`, error);
	}
}
