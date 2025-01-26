import { writable } from 'svelte/store';
import { updatePWAThemeColor } from './pwa';
import { getUserData, setUserData } from '../util/userData';

export type Theme = (typeof themes)[number];
export const themes = [
	'system',
	'light',
	'dark',
	'cupcake',
	'bumblebee',
	'emerald',
	'corporate',
	'synthwave',
	'retro',
	'cyberpunk',
	'valentine',
	'halloween',
	'garden',
	'forest',
	'aqua',
	'lofi',
	'pastel',
	'fantasy',
	'wireframe',
	'black',
	'luxury',
	'dracula',
	'cmyk',
	'autumn',
	'business',
	'acid',
	'lemonade',
	'night',
	'coffee',
	'winter',
	'dim',
	'nord',
	'sunset'
];

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
