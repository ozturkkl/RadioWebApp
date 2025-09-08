import type { PlayerState } from '$lib/stores/player';

interface MediaSessionHandlers {
	onSeekForward: () => void;
	onSeekBackward: () => void;
	onNextTrack: () => void;
	onPreviousTrack: () => void;
	onStop: () => void;
}

export function initMediaSession(handlers: MediaSessionHandlers) {
	if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
	const safeSetAction = (action: MediaSessionAction, handler: () => void) => {
		try {
			navigator.mediaSession.setActionHandler(action, handler);
		} catch {
			/* noop */
		}
	};

	safeSetAction('seekforward', () => handlers.onSeekForward());
	safeSetAction('seekbackward', () => handlers.onSeekBackward());
	safeSetAction('nexttrack', () => handlers.onNextTrack());
	safeSetAction('previoustrack', () => handlers.onPreviousTrack());
	safeSetAction('stop', () => handlers.onStop());
}

export function updateMediaSessionMetadata(state: PlayerState) {
	if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
	try {
		let title = '';
		let artist = '';
		let album = '';
		const artwork: Array<{ src: string; sizes?: string; type?: string }> = [];

		if (state.type === 'podcast') {
			title = state.currentEpisode?.title ?? state.currentPodcast?.title ?? '';
			artist = state.currentPodcast?.title ?? '';
			album = state.currentPodcast?.title ?? '';
			const img = state.currentEpisode?.image || state.currentPodcast?.imageUrl;
			if (img) artwork.push({ src: img });
		} else if (state.type === 'radio') {
			title = state.currentRadio?.trackInfo?.title || state.currentRadio?.title || '';
			artist = state.currentRadio?.trackInfo?.artist || state.currentRadio?.title || '';
			album = state.currentRadio?.title || '';
			const cover = state.currentRadio?.trackInfo?.cover || state.currentRadio?.image;
			if (cover) artwork.push({ src: cover });
		}

		navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album, artwork });
	} catch {
		/* noop */
	}
}
