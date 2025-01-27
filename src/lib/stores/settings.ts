import { get, writable } from 'svelte/store';
import { getUserData, setUserData } from '$lib/util/userData';
import { updatePWAThemeColor } from '$lib/stores/pwa';
import { type Theme } from '$lib/util/theme';

export type Settings = {
	theme: Theme;
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
		updatePWAThemeColor();
	});

	watchSystemTheme();

	function _update(state: Partial<Settings>) {
		update((current) => ({ ...current, ...state }));
	}

	return {
		subscribe,
		update: _update
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
