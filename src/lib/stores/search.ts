import { browser } from '$app/environment';
import { pushState, replaceState } from '$app/navigation';
import { page } from '$app/stores';
import { derived, get, writable } from 'svelte/store';

export const searchQuery = writable('');
export const searchOpen = derived(page, ($page) => !!$page.state.search);

function pageState(): App.PageState {
	return get(page).state;
}

export function openSearch() {
	if (browser && !get(searchOpen)) {
		// TWA/Android back should dismiss search instead of leaving the page.
		pushState('', { ...pageState(), search: true });
	}
}

export function closeSearch(options?: { popHistory?: boolean }) {
	const popHistory = options?.popHistory ?? true;
	const wasOpen = get(searchOpen);
	searchQuery.set('');
	if (!wasOpen || !browser) return;
	if (popHistory) {
		history.back();
	} else {
		replaceState('', { ...pageState(), search: false });
	}
}

export function clearSearch(): boolean {
	const hadQuery = get(searchQuery).trim().length > 0;
	const wasOpen = get(searchOpen);
	if (!hadQuery && !wasOpen) return false;
	closeSearch();
	return true;
}
