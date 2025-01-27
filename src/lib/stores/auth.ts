import { get, writable } from 'svelte/store';

export interface User {
	sub: string;
	email: string;
	access_token: string;
}

function createAuthStore() {
	const { subscribe, set } = writable<User | null>(null);

	async function initAuth() {
		try {
			const response = await fetch('/auth');
			const userData = await response?.json();
			console.log('userData: ', JSON.stringify(userData, null, 2));
			set(userData);
		} catch {
			set(null);
		}
	}

	async function signOut() {
		try {
			await fetch('/auth/logout', { method: 'POST' });
			set(null);
		} catch {
			set(null);
		}
	}

	return {
		subscribe,
		initAuth,
		signOut
	};
}

export const user = createAuthStore();

if (typeof window !== 'undefined') {
	user.initAuth();
}

export async function signInWithGoogle(prompt: boolean = false) {
	console.log('Starting Google Sign In...');

	// Generate a random state value for CSRF protection
	const state = crypto.randomUUID();
	console.log('Generated state:', state);

	document.cookie = `oauth_state=${state};path=/;max-age=3600;samesite=lax`;

	const playAfterLogin = await get((await import('$lib/stores/player')).playerStore).isPlaying;
	const gotoAfterLogin = window.location.pathname;

	const response = await fetch('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ state, prompt, playAfterLogin, gotoAfterLogin })
	});
	const data = await response?.json();
	const authUrl = data?.authUrl;
	if (!authUrl) {
		throw new Error('No auth URL provided');
	}

	window.location.href = authUrl;
}
