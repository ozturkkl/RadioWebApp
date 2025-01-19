import { writable } from 'svelte/store';
import { settings } from './settings';
import { updatePodcastProgress } from './podcastProgress';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { updateRadioProgress } from './radioProgress';
import { podcasts, type Episode, type Podcast } from './podcasts';
import type { Radio } from './radios';
import { blinkClasses } from '$lib/util/blinkClassess';
import { scrollIntoViewPromise } from '$lib/util/scrollIntoViewPromised';

export type PlayerType = 'radio' | 'podcast';

interface BasePlayerState {
	isPlaying: boolean;
	currentTime: number;
	volume: number;
	playbackRate: number;
	muted: boolean;
	isBuffering: boolean;
	errored: boolean;
}

interface RadioPlayerState extends BasePlayerState {
	type: 'radio';
	currentRadio: Radio;
	currentPodcast: null;
	currentEpisode: null;
	playlist: [];
	duration: 0;
	playbackRate: 1;
}

interface PodcastPlayerState extends BasePlayerState {
	type: 'podcast';
	currentRadio: null;
	currentPodcast: Podcast;
	currentEpisode: Episode;
	playlist: Episode[];
	duration: number;
}

interface IdlePlayerState extends BasePlayerState {
	type: null;
	currentRadio: null;
	currentPodcast: null;
	currentEpisode: null;
	playlist: [];
	duration: 0;
}

export type PlayerState = RadioPlayerState | PodcastPlayerState | IdlePlayerState;

const initialState: PlayerState = {
	isPlaying: false,
	currentTime: 0,
	duration: 0,
	volume: get(settings).volume ?? 1,
	playbackRate: get(settings).playbackRate ?? 1,
	muted: get(settings).muted ?? false,
	isBuffering: false,
	errored: false,
	type: null,
	currentRadio: null,
	currentPodcast: null,
	currentEpisode: null,
	playlist: []
};

// Initialize audio only in browser environment
let audio: HTMLAudioElement | undefined;
if (typeof window !== 'undefined') {
	initAudio();
}
function initAudio() {
	if (audio) return;
	if (typeof window === 'undefined') return; // Skip initialization if not in browser

	audio = new Audio();

	audio.addEventListener('timeupdate', () => {
		playerStore.update((state) => {
			if (!state.isBuffering) {
				return {
					...state,
					currentTime: audio?.currentTime ?? 0
				};
			}
			return state;
		});

		const currentState = get(playerStore);
		if (currentState.type === 'podcast') {
			updatePodcastProgress(
				currentState.currentPodcast.id,
				currentState.currentEpisode.id,
				audio?.currentTime ?? 0
			);
		}
	});

	audio.addEventListener('loadstart', () => {
		playerStore.update((state) => ({ ...state, isBuffering: true }));
	});
	audio.addEventListener('waiting', () => {
		playerStore.update((state) => ({ ...state, isBuffering: true }));
	});
	audio.addEventListener('waitingforkey', () => {
		playerStore.update((state) => ({ ...state, isBuffering: true }));
	});
	// audio.addEventListener('progress', () => {
	// 	console.log('progress');
	// });

	audio.addEventListener('canplay', () => {
		playerStore.update((state) => ({ ...state, isBuffering: false, errored: false }));
	});
	audio.addEventListener('playing', () => {
		playerStore.update((state) => ({ ...state, isBuffering: false, errored: false }));
	});
	// audio.addEventListener('suspend', () => {
	// 	console.log('suspend');
	// });

	audio.addEventListener('stalled', () => {
		resetAudio();
	});

	audio.addEventListener('error', () => {
		playerStore.update((state) => ({ ...state, errored: true }));
	});
	audio.addEventListener('abort', () => {
		playerStore.update((state) => ({ ...state, errored: true }));
	});

	audio.addEventListener('ended', () => {
		nextTrack(get(settings).autoplay);
	});

	audio.addEventListener('pause', () => {
		playerStore.update((state) => ({ ...state, isPlaying: false }));
	});
	audio.addEventListener('play', () => {
		playerStore.update((state) => ({ ...state, isPlaying: true, muted: state.volume === 0 }));
	});
}
export function resetAudio() {
	if (audio) {
		const currentTime = audio.currentTime;
		const currentPlaying = !audio.paused;
		audio.load();
		setTimeout(() => {
			if (currentPlaying) {
				audio!.play();
			}
			audio!.currentTime = currentTime;
		}, 0);
	}
}

export const playerStore = writable<PlayerState>(initialState);
playerStore.subscribe((state) => {
	if (!audio) return;

	let shouldUpdateSource = false;

	// Check if source needs updating
	if (state.type === 'radio') {
		shouldUpdateSource = !audio.src || audio.src !== state.currentRadio.streamUrl;
	} else if (state.type === 'podcast') {
		shouldUpdateSource = !audio.src || audio.src !== state.currentEpisode.url;
	}

	// Update source if needed
	if (shouldUpdateSource) {
		if (state.type === 'radio') {
			console.log('playing radio', state.currentRadio.streamUrl);
			audio.src = state.currentRadio.streamUrl;
			audio.playbackRate = 1;
			updateRadioProgress(state.currentRadio.id);
		} else if (state.type === 'podcast') {
			console.log('playing podcast', state.currentEpisode.url);
			audio.src = state.currentEpisode.url;
			updatePodcastProgress(state.currentPodcast.id, state.currentEpisode.id, 0);
		}
		// Wait for the source to be loaded
		audio.load();
	}

	// Always update volume, playback rate and muted state
	audio.volume = state.volume;
	audio.muted = state.muted;
	if (state.type === 'podcast' && state.playbackRate) {
		audio.playbackRate = state.playbackRate;
	}
});

export function playRadio(radio: Radio): void {
	playerStore.update(
		(state): RadioPlayerState => ({
			...state,
			type: 'radio',
			currentTime: 0,
			duration: 0,
			playbackRate: 1,
			currentRadio: radio,
			currentPodcast: null,
			currentEpisode: null,
			playlist: []
		})
	);

	toggleAudioWhenReady(true);
}
export function playPodcast(
	podcast: Podcast,
	startWithEpisode?: Episode,
	startWithTime: number = 0
) {
	const episodeToPlay = startWithEpisode || podcast.items[0];
	if (!episodeToPlay) return;

	playerStore.update(
		(state): PodcastPlayerState => ({
			...state,
			type: 'podcast',
			currentTime: startWithTime,
			currentRadio: null,
			currentPodcast: podcast,
			currentEpisode: episodeToPlay,
			playlist: podcast.items,
			duration: episodeToPlay.duration ? Number(episodeToPlay.duration) : 0
		})
	);

	seekTo(startWithTime);
	toggleAudioWhenReady(true);
}

// Player controls for AUDIO element
export function togglePlayPause() {
	const playerError = get(playerStore).errored;
	if (playerError) {
		resetAudio();
	}
	toggleAudioWhenReady();
}
export function seekTo(time: number) {
	if (audio) {
		audio.currentTime = time;
	}
}
export function skipForward() {
	if (!audio) return;
	const skipAmount = get(settings).skipSeconds;
	const newTime = Math.min(audio.currentTime + skipAmount, audio.duration);
	audio.currentTime = newTime;
}
export function skipBackward() {
	if (!audio) return;
	const skipAmount = get(settings).skipSeconds;
	const newTime = Math.max(audio.currentTime - skipAmount, 0);
	audio.currentTime = newTime;
}
export function restartRadio() {
	const state = get(playerStore);
	if (state.type === 'radio' && state.currentRadio && audio) {
		const currentUrl = state.currentRadio.streamUrl;
		audio.src = currentUrl;
		audio.load();
		toggleAudioWhenReady(true);
	}
}
function toggleAudioWhenReady(value?: boolean, retries: number = 0) {
	setTimeout(() => {
		if (retries > 10) return;
		if (!audio) {
			return setTimeout(() => toggleAudioWhenReady(value, retries + 1), 100);
		}
		if (audio) {
			if (value === undefined) {
				value = audio.paused;
			}
			if (value) {
				audio.play().catch((e) => {
					if (e.name === 'NotAllowedError') {
						playerStore.update((state) => ({ ...state, muted: true }));
					} else {
						playerStore.update((state) => ({ ...state, errored: true }));
					}
				});
			} else {
				audio.pause();
			}
		}
	}, 0);
}

// Player controls for playerStore
export function updateVolume(volume: number) {
	const normalizedVolume = Math.max(0, Math.min(1, volume));
	settings.update((s) => ({ ...s, volume: normalizedVolume }));
	playerStore.update((state) => ({
		...state,
		volume: normalizedVolume,
		muted: normalizedVolume === 0
	}));
}

export function toggleMuted(muted?: boolean) {
	playerStore.update((state) => {
		const newMuted = muted ?? !state.muted;
		settings.update((s) => ({ ...s, muted: newMuted }));
		if (!newMuted) {
			toggleAudioWhenReady(true);
		}
		return {
			...state,
			muted: newMuted
		};
	});
}

export function updatePlaybackRate(rate: number) {
	playerStore.update((state): PlayerState => {
		if (state.type === 'podcast') {
			settings.update((s) => ({ ...s, playbackRate: rate }));
			return { ...state, playbackRate: rate };
		}
		return { ...state, playbackRate: 1 };
	});
}
export function nextTrack(autoPlay: boolean = true) {
	playerStore.update((state) => {
		if (state.type !== 'podcast' || !state.currentEpisode) return state;
		const currentIndex = state.playlist.findIndex((ep) => ep.id === state.currentEpisode?.id);
		if (currentIndex < state.playlist.length - 1) {
			const nextEpisode = state.playlist[currentIndex + 1];

			if (autoPlay) {
				toggleAudioWhenReady(true);
			}
			return {
				...state,
				currentEpisode: nextEpisode,
				duration: Number(nextEpisode.duration),
				currentTime: 0,
				isPlaying: !(audio?.paused ?? true)
			};
		} else {
			toggleAudioWhenReady(false);
		}
		return state;
	});
}
export function previousTrack() {
	playerStore.update((state) => {
		if (state.type !== 'podcast' || !state.currentEpisode) return state;
		const currentIndex = state.playlist.findIndex((ep) => ep.id === state.currentEpisode?.id);
		if (currentIndex > 0) {
			const prevEpisode = state.playlist[currentIndex - 1];
			return {
				...state,
				currentEpisode: prevEpisode,
				duration: Number(prevEpisode.duration),
				currentTime: 0,
				isPlaying: !(audio?.paused ?? true)
			};
		}
		return state;
	});
	toggleAudioWhenReady(true);
}

// UI related functions
export function togglePlaylist(targetPodcastId?: string) {
	const state = get(playerStore);
	const podcastId = targetPodcastId ?? (state.type === 'podcast' ? state.currentPodcast?.id : null);

	if (podcastId) {
		// Navigate to main page using SvelteKit's goto
		goto('/').then(() => {
			const podcast = podcastId ? get(podcasts).find((p) => p.id === podcastId) : null;
			// After navigation, find and expand the podcast
			const podcastElement = document.querySelector(`[data-podcast-id="${podcastId}"]`);
			if (podcastElement) {
				// Function to find and scroll to episode
				const scrollToEpisode = async () => {
					const episodeButtons = podcastElement.querySelectorAll('button');
					const episodeId = state.currentEpisode?.id ?? podcast?.items[0].id;
					const episodeElement =
						Array.from(episodeButtons).find(
							(button) => button.getAttribute('data-episode-id') === episodeId
						) ?? episodeButtons[0];
					if (episodeElement) {
						scrollIntoViewPromise(episodeElement, { behavior: 'smooth', block: 'nearest' });
						scrollIntoViewPromise(podcastElement, { behavior: 'smooth', block: 'center' });
					}
				};

				// Expand the podcast if not already expanded
				const checkbox = podcastElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
				if (checkbox && !checkbox.checked) {
					// Trigger the change event properly
					checkbox.checked = true;
					checkbox.dispatchEvent(new Event('change', { bubbles: true }));
				}

				// Get the collapse content element
				const collapseContent = podcastElement.querySelector('.collapse-content');
				if (collapseContent) {
					if (collapseContent.getAnimations().length > 0) {
						// Listen for the transition end
						const onTransitionEnd = () => {
							collapseContent.removeEventListener('transitionend', onTransitionEnd);
							scrollToEpisode();
						};
						collapseContent.addEventListener('transitionend', onTransitionEnd);
					} else {
						scrollToEpisode();
					}
				}
			} else {
				// If podcast is not found, check if it exists and if current category doesn't include it
				const settingsStore = get(settings);
				if (
					settingsStore.selectedCategory !== 'All' &&
					podcast?.categories &&
					!podcast.categories.includes(settingsStore.selectedCategory)
				) {
					settings.update((s) => ({ ...s, selectedCategory: 'All' }));
					// Wait for the next tick to let the UI update
					setTimeout(() => {
						return togglePlaylist(targetPodcastId);
					}, 0);
				}
			}
		});
	} else if (state.type === 'radio' && state.currentRadio) {
		// Navigate to main page using SvelteKit's goto
		goto('/').then(async () => {
			// Find the radio card by title
			const radioCard = Array.from(document.querySelectorAll('[role="button"]')).find(
				(element) => element.querySelector('h3')?.textContent === state.currentRadio?.title
			) as HTMLElement;
			if (radioCard) {
				await scrollIntoViewPromise(radioCard, { behavior: 'smooth', block: 'center' });
				// add focus visible
				const focusClasses = ['outline-primary', 'outline-2', 'outline-offset-2', 'outline'];
				radioCard.focus({ preventScroll: true });
				radioCard.onblur = () => {
					focusClasses.forEach((className) => radioCard.classList.remove(className));
				};
				await blinkClasses(radioCard, focusClasses, 1, 0, 1500);
			}
		});
	}
}
