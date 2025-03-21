import { get, writable } from 'svelte/store';
import { getUserData, setUserData } from '$lib/util/userData';
import { refreshPWAThemeColor } from '$lib/stores/pwa';
import { type Theme } from '$lib/util/theme';
import { refreshStoreAfterGoogleFetch } from '$lib/util/googleDriveHelpers';
import type { languages } from '$lib/i18n';

export type Settings = {
	theme: Theme;
	language: keyof typeof languages;
	autoplay: boolean;
	autoCollapse: boolean;
	skipSeconds: number;
	playbackRate: number;
	volume: number;
	muted: boolean;
	selectedCategory: string;
	autoplayLastContent: boolean;
};

function createSettingsStore() {
	const initialState: Settings = getUserData('app-settings');
	const { subscribe, update } = writable<Settings>(initialState);

	subscribe((value) => {
		setUserData('app-settings', value);
		applySystemTheme(value.theme);
		refreshPWAThemeColor();
	});

	refreshStoreAfterGoogleFetch('app-settings', update);

	watchSystemTheme();

	return {
		subscribe,
		updateSettings: (state: Partial<Settings>) => update((current) => ({ ...current, ...state }))
	};
}

function watchSystemTheme() {
	if (typeof window === 'undefined') return;
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		applySystemTheme(get(settings).theme);
	});
}

function applySystemTheme(theme: Theme) {
	if (typeof window === 'undefined') return;

	// Apply theme using daisyUI, handling system theme
	const finalTheme =
		theme === 'system'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: theme;
	document.documentElement.setAttribute('data-theme', finalTheme);
}

export const settings = createSettingsStore();
