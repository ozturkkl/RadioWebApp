import { writable } from 'svelte/store';

export type Theme =
	| 'light'
	| 'dark'
	| 'cupcake'
	| 'bumblebee'
	| 'emerald'
	| 'corporate'
	| 'synthwave'
	| 'retro'
	| 'cyberpunk'
	| 'night';

interface Settings {
	theme: Theme;
	autoplay: boolean;
	autoCollapse: boolean;
	skipSeconds: number;
	playbackRate: number;
	volume: number;
	selectedCategory: string;
}

// Initialize settings from localStorage if available
const getInitialSettings = (): Settings => {
	if (typeof window === 'undefined') {
		return {
			theme: 'light',
			autoplay: true,
			autoCollapse: true,
			skipSeconds: 5,
			playbackRate: 1.0,
			volume: 1.0,
			selectedCategory: 'All'
		};
	}

	const savedSettings = localStorage.getItem('app-settings');
	if (savedSettings) {
		return JSON.parse(savedSettings);
	}

	// Check system preference for theme
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	return {
		theme: prefersDark ? 'dark' : 'light',
		autoplay: true,
		autoCollapse: true,
		skipSeconds: 5,
		playbackRate: 1.0,
		volume: 1.0,
		selectedCategory: 'All'
	};
};

// Create the store
export const settings = writable<Settings>(getInitialSettings());

// Subscribe to changes and save to localStorage
if (typeof window !== 'undefined') {
	settings.subscribe((value) => {
		localStorage.setItem('app-settings', JSON.stringify(value));

		// Apply theme using daisyUI
		document.documentElement.setAttribute('data-theme', value.theme);
	});

	// Listen for system theme changes
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		settings.update((s) => ({
			...s,
			theme: e.matches ? 'dark' : 'light'
		}));
	});
}
