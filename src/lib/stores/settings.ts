import { writable } from 'svelte/store';
import { getUserData, setUserData } from '$lib/util/userData';
import { updatePWAThemeColor } from '$lib/stores/pwa';
import { type Theme } from '$lib/util/theme';

export interface Settings {
	theme: Theme;
	autoplay: boolean;
	autoCollapse: boolean;
	skipSeconds: number;
	playbackRate: number;
	volume: number;
	muted: boolean;
	selectedCategory: string;
	autoplayLastContent: boolean;
}

// Create the store
export const settings = writable<Settings>(getUserData('app-settings'));

if (typeof window !== 'undefined') {
	settings.subscribe((value) => {
		setUserData('app-settings', value);

		// Apply theme using daisyUI, handling system theme
		const theme =
			value.theme === 'system'
				? window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'
				: value.theme;
		document.documentElement.setAttribute('data-theme', theme);

		// Update PWA theme color with the current theme's background color
		updatePWAThemeColor();
	});

	// Listen for system theme changes
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		settings.subscribe((s) => {
			if (s.theme === 'system') {
				document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');

				updatePWAThemeColor();
			}
		});
	});
}
