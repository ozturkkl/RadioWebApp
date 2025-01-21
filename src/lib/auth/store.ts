import { writable } from 'svelte/store';

export interface User {
	sub: string;
	email: string;
	access_token: string;
}

export const user = writable<User | null>(null);

if (typeof window !== 'undefined') {
	initAuth();
}

export async function initAuth() {
	try {
		const response = await fetch('/auth');
		const userData = await response?.json();
		console.log('userData: ', JSON.stringify(userData, null, 2));
		user.set(userData);
	} catch {
		user.set(null);
	}
}

export async function signInWithGoogle(prompt: boolean = false) {
	try {
		console.log('Starting Google Sign In...');

		// Generate a random state value for CSRF protection
		const state = crypto.randomUUID();
		console.log('Generated state:', state);

		document.cookie = `oauth_state=${state};path=/;max-age=3600;samesite=lax`;

		const response = await fetch('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ state, prompt })
		});
		const data = await response?.json();
		const authUrl = data?.authUrl;
		if (!authUrl) {
			throw new Error('No auth URL provided');
		}

		window.location.href = authUrl;
	} catch {
		user.set(null);
	}
}

export async function signOut() {
	try {
		await fetch('/auth/logout', { method: 'POST' });
		user.set(null);
	} catch {
		user.set(null);
	}
}
