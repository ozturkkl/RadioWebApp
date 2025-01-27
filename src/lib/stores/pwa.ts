import { writable } from 'svelte/store';

export interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const deferredInstallPrompt = writable<BeforeInstallPromptEvent | null>(null);
export const isInstalled = writable(false);

// Function to update PWA theme meta tags
export function updatePWAThemeColor() {
	if (typeof window === 'undefined') return;
	setTimeout(() => {
		const themeColorTag = document.querySelector('meta[name="theme-color"]');
		const color = getCurrentThemeColor();
		if (themeColorTag) {
			themeColorTag.setAttribute('content', color);
		}
	}, 0);
}

// Function to get the current theme's background color
function getCurrentThemeColor(): string {
	if (typeof window === 'undefined') return '#262626';

	// Create a temporary element with bg-base-100 to get the computed background color
	const temp = document.createElement('div');
	temp.className = 'bg-base-200';
	document.body.appendChild(temp);
	const color = window.getComputedStyle(temp).backgroundColor;
	document.body.removeChild(temp);
	return color;
}
