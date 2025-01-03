import { writable } from 'svelte/store';

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
			theme: 'system',
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

	return {
		theme: 'system',
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

		// Apply theme using daisyUI, handling system theme
		const theme =
			value.theme === 'system'
				? window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'
				: value.theme;
		document.documentElement.setAttribute('data-theme', theme);
	});

	// Listen for system theme changes
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		settings.subscribe((s) => {
			if (s.theme === 'system') {
				document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
			}
		});
	});
}
