import { writable, get } from 'svelte/store';
import { settings } from '$lib/stores/settings';
import { goto } from '$app/navigation';
import { podcasts, type Episode, type Podcast } from '$lib/stores/podcast/podcasts';
import { radios, type Radio } from '$lib/stores/radio/radios';
import { blinkClasses } from '$lib/util/blinkClassess';
import { scrollIntoViewPromise } from '$lib/util/scrollIntoViewPromised';
import { podcastProgress } from '$lib/stores/podcast/podcastProgress';
import { radioProgress } from '$lib/stores/radio/radioProgress';

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

function readyStateIsAbleToPlay(readyState: number) {
	return (
		readyState === HTMLMediaElement.HAVE_CURRENT_DATA ||
		readyState === HTMLMediaElement.HAVE_FUTURE_DATA ||
		readyState === HTMLMediaElement.HAVE_ENOUGH_DATA
	);
}

// Initialize audio only in browser environment
let audio: HTMLAudioElement | undefined;
let resetAudioInterval: NodeJS.Timeout | undefined;

if (typeof window !== 'undefined') {
	initAudio();
	if (get(settings).autoplayLastContent) {
		autoplayLastContent();
	}
}
function initAudio() {
	if (audio) return;

	audio = new Audio();

	audio.addEventListener('timeupdate', () => {
		playerStore.updateCurrentTime();
		if (resetAudioInterval && readyStateIsAbleToPlay(audio?.readyState ?? 0)) {
			clearInterval(resetAudioInterval);
		}

		const currentState = get(playerStore);
		if (currentState.type === 'podcast') {
			podcastProgress.updatePodcastProgress(
				currentState.currentPodcast.id,
				currentState.currentEpisode.id,
				audio?.currentTime ?? 0
			);
		}
	});

	audio.addEventListener('loadstart', () => {
		playerStore.setBuffering(true);
	});
	audio.addEventListener('waiting', () => {
		playerStore.setBuffering(true);
	});
	audio.addEventListener('waitingforkey', () => {
		playerStore.setBuffering(true);
	});
	// audio.addEventListener('progress', () => {
	// 	console.log('progress');
	// });

	audio.addEventListener('canplay', () => {
		playerStore.setBuffering(false);
	});
	audio.addEventListener('playing', () => {
		playerStore.setBuffering(false);
		playerStore.setErrored(false);
	});
	// suspend happens when the download happens and is paused until the player reaches the point of the download
	// audio.addEventListener('suspend', () => {
	// 	console.log(`suspend`);
	// });

	audio.addEventListener('stalled', () => {
		if (resetAudioInterval) {
			clearInterval(resetAudioInterval);
		}
		resetAudioInterval = setInterval(() => {
			resetAudio();
		}, 4000);
	});

	audio.addEventListener('error', () => {
		playerStore.setErrored();
	});
	audio.addEventListener('abort', () => {
		playerStore.setErrored();
	});

	audio.addEventListener('ended', () => {
		playerStore.nextTrack(get(settings).autoplay);
	});

	audio.addEventListener('pause', () => {
		playerStore.updateIsPlaying();
	});
	audio.addEventListener('play', () => {
		playerStore.updateIsPlaying();
	});
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
						playerStore.setMuted();
					} else {
						playerStore.setErrored();
					}
				});
			} else {
				audio.pause();
			}
		}
	}, 0);
}
function resetAudio() {
	if (audio) {
		if (audio.paused && get(playerStore).errored !== true) {
			return;
		}

		const currentTime = audio.currentTime;
		audio.load();
		setTimeout(() => {
			if (readyStateIsAbleToPlay(audio?.readyState ?? 0)) {
				audio!.play();
			}
			audio!.currentTime = currentTime;
		}, 0);
	}
}

function createPlayerStore() {
	const initialState: PlayerState = {
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		volume: get(settings)?.volume ?? 1,
		playbackRate: get(settings)?.playbackRate ?? 1,
		muted: get(settings)?.muted ?? false,
		isBuffering: false,
		errored: false,
		type: null,
		currentRadio: null,
		currentPodcast: null,
		currentEpisode: null,
		playlist: []
	};

	const { subscribe, update } = writable<PlayerState>(initialState);

	subscribe((state) => {
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
				radioProgress.updateRadioProgress(state.currentRadio.id);
			} else if (state.type === 'podcast') {
				console.log('playing podcast', state.currentEpisode.url);
				audio.src = state.currentEpisode.url;
				podcastProgress.updatePodcastProgress(state.currentPodcast.id, state.currentEpisode.id, 0);
			}
			// Wait for the source to be loaded
			audio.load();
		}

		// Always update volume, playback rate and muted state
		audio.volume = state.volume;
		audio.muted = state.muted;
		if (
			state.type === 'podcast' &&
			state.playbackRate &&
			audio &&
			audio.playbackRate !== state.playbackRate
		) {
			audio.playbackRate = state.playbackRate;
		}
	});

	function playRadio(radio: Radio) {
		update(
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

	function playPodcast(podcast: Podcast, startWithEpisode?: Episode, startWithTime: number = 0) {
		const episodeToPlay = startWithEpisode || podcast.items[0];
		if (!episodeToPlay) return;

		update(
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

	function setErrored(errored = true) {
		update((state) => ({ ...state, errored }));
	}

	function setMuted(muted = true) {
		update((state) => ({ ...state, muted }));
	}

	function setVolume(volume: number) {
		const normalizedVolume = Math.max(0, Math.min(1, volume));
		settings.updateSettings({ volume: normalizedVolume });
		update((state) => ({
			...state,
			volume: normalizedVolume,
			muted: normalizedVolume === 0
		}));
	}

	function toggleMuted(muted?: boolean) {
		update((state) => {
			const newMuted = muted ?? !state.muted;
			settings.updateSettings({ muted: newMuted });
			if (!newMuted) {
				toggleAudioWhenReady(true);
			}
			return {
				...state,
				muted: newMuted
			};
		});
	}

	function nextTrack(autoPlay: boolean = true) {
		update((state) => {
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

	function previousTrack() {
		update((state) => {
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

	function updateCurrentTime() {
		update((state) => {
			if (!state.isBuffering) {
				return {
					...state,
					currentTime: audio?.currentTime ?? 0
				};
			}
			return state;
		});
	}

	function setPlaybackRate(playbackRate: number) {
		update((state) => {
			if (state.type === 'podcast') {
				settings.updateSettings({ playbackRate });
				return { ...state, playbackRate };
			} else {
				return state;
			}
		});
	}

	function updateIsPlaying() {
		update((state) => ({
			...state,
			isPlaying: !(audio?.paused ?? true),
			muted: state.volume === 0
		}));
	}

	function setBuffering(buffering: boolean) {
		update((state) => ({ ...state, isBuffering: buffering }));
	}

	return {
		subscribe,
		setErrored,
		setMuted,
		setVolume,
		setBuffering,
		updateCurrentTime,
		updateIsPlaying,
		toggleMuted,
		playRadio,
		playPodcast,
		nextTrack,
		previousTrack,
		setPlaybackRate
	};
}

export const playerStore = createPlayerStore();

settings.subscribe((settings) => {
	if (settings.playbackRate !== get(playerStore).playbackRate) {
		playerStore.setPlaybackRate(settings.playbackRate);
	}
	if (settings.volume !== get(playerStore).volume) {
		playerStore.setVolume(settings.volume);
	}
});

// Player controls for AUDIO element
export function togglePlayPause(value?: boolean) {
	const playerError = get(playerStore).errored;
	if (playerError) {
		return resetAudio();
	}
	toggleAudioWhenReady(value);
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

// Other player utilities
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
						const onTransitionEnd = (ev: Event) => {
							if (ev.target !== collapseContent) return;
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
					settings.updateSettings({ selectedCategory: 'All' });
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
export async function autoplayLastContent() {
	// Get the last played times for radios and podcasts
	const lastPlayedRadio = Object.entries(get(radioProgress)).reduce(
		(latest, [id, progress]) => {
			if (!latest || progress.lastPlayed > latest.lastPlayed) {
				return { id, lastPlayed: progress.lastPlayed };
			}
			return latest;
		},
		null as { id: string; lastPlayed: number } | null
	);

	const lastPlayedPodcast = Object.entries(get(podcastProgress)).reduce(
		(latest, [id, progress]) => {
			if (!latest || progress.lastPlayed > latest.lastPlayed) {
				return {
					id,
					lastPlayed: progress.lastPlayed,
					episodeId: progress.episodeId,
					timestamp: progress.timestamp
				};
			}
			return latest;
		},
		null as { id: string; lastPlayed: number; episodeId: string; timestamp: number } | null
	);

	// If neither exists, return
	if (!lastPlayedRadio && !lastPlayedPodcast) return;

	// If both exist, play the most recently played one
	if (lastPlayedRadio && lastPlayedPodcast) {
		if (lastPlayedRadio.lastPlayed > lastPlayedPodcast.lastPlayed) {
			const radio = await get(radios).find((r) => r.id === lastPlayedRadio.id);
			if (radio) playerStore.playRadio(radio);
		} else {
			const podcast = await get(podcasts).find((p: Podcast) => p.id === lastPlayedPodcast.id);
			if (podcast) {
				const episode = podcast.items.find((e: Episode) => e.id === lastPlayedPodcast.episodeId);
				if (episode) {
					playerStore.playPodcast(podcast, episode, lastPlayedPodcast.timestamp);
				}
			}
		}
		return;
	}

	// If only radio exists
	if (lastPlayedRadio) {
		const radio = await get(radios).find((r) => r.id === lastPlayedRadio.id);
		if (radio) playerStore.playRadio(radio);
		return;
	}

	// If only podcast exists
	if (lastPlayedPodcast) {
		const podcast = await get(podcasts).find((p: Podcast) => p.id === lastPlayedPodcast.id);
		if (podcast) {
			const episode = podcast.items.find((e: Episode) => e.id === lastPlayedPodcast.episodeId);
			if (episode) {
				playerStore.playPodcast(podcast, episode, lastPlayedPodcast.timestamp);
			}
		}
	}
}
