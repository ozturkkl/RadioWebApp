import type { PodcastProgress } from '$lib/stores/podcastProgress';
import type { Podcast } from '$lib/stores/podcasts';
import type { RadioProgress } from '$lib/stores/radioProgress';
import type { Radio } from '$lib/stores/radios';
import type { Settings } from '$lib/stores/settings';
import { throttledSyncUserDataKeyWithGoogle } from '$lib/util/googleDriveHelpers';

export interface UserData {
	'favorite-radios': Record<string, boolean>;
	'favorite-podcasts': Record<string, boolean>;
	'podcast-progress': PodcastProgress;
	'radio-progress': RadioProgress;
	'cached-podcasts': Podcast[];
	'cached-radios': Radio[];
	'app-settings': Settings;
}

export const userDataDefaults: UserData = {
	'favorite-radios': {},
	'favorite-podcasts': {},
	'podcast-progress': {},
	'radio-progress': {},
	'cached-podcasts': [],
	'cached-radios': [],
	'app-settings': {
		theme: 'system',
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
	console.log(`kemalog - getUserData - ${key}`);
	try {
		const data = localStorage.getItem(key);
		return data ? JSON.parse(data) : userDataDefaults[key];
	} catch (error) {
		console.error(`Error parsing user data for key ${key}:`, error);
		return userDataDefaults[key];
	}
}

export function setUserData<K extends keyof UserData>(key: K, data: UserData[K]) {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		console.log(`kemalog - setUserData - ${key}: ${JSON.stringify(data, null, 2)}`);
		localStorage.setItem(key, JSON.stringify(data));
	} catch (error) {
		console.error(`Error setting user data for key ${key}:`, error);
	}
}
