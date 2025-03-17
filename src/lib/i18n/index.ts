import { en } from './langs/en';
import { tr } from './langs/tr';
import { derived, writable } from 'svelte/store';
import { browser } from '$app/environment';

// Define the available languages
export const languages = {
	en: 'English',
	tr: 'Türkçe'
};

// Define the translations
const translations = {
	en,
	tr
};

// Create a type for the translations
export type TranslationType = typeof en;

// Create a writable store for language with default 'en'
const languageStore = writable<keyof typeof languages>('en');

// Create a derived store for the translations
export const t = derived(languageStore, (lang) => translations[lang in languages ? lang : 'en']);

// Self-initialization with delayed import to avoid circular dependency
if (browser) {
	// Use dynamic import with a small delay to ensure settings is fully initialized
	setTimeout(async () => {
		const { settings } = await import('$lib/stores/settings');
		settings.subscribe(($settings) => {
			if ($settings?.language) {
				// Update the language store
				languageStore.set($settings.language);
				// Update HTML lang attribute
				document.documentElement.lang = $settings.language;
			}
		});
	}, 0);
}
