import { writable } from 'svelte/store';
import type { Episode, Podcast } from '$lib/util/fetchPodcasts';
import type { Radio } from '$lib/util/fetchRadios';
import { settings } from './settings';
import { updatePodcastProgress } from './podcastProgress';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';

export type PlayerType = 'radio' | 'podcast';

interface BasePlayerState {
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    playbackRate: number;
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
    volume: 1,
    playbackRate: 1,
    type: null,
    currentRadio: null,
    currentPodcast: null,
    currentEpisode: null,
    playlist: [],
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
        playerStore.update((state) => ({
            ...state,
            currentTime: audio?.currentTime ?? 0,
        }));

        const currentState = get(playerStore);
        if (currentState.type === 'podcast') {
            updatePodcastProgress(currentState.currentPodcast.id, currentState.currentEpisode.id, audio?.currentTime ?? 0);
        }
    });

    audio.addEventListener('ended', () => {
        nextTrack(get(settings).autoplay);
    });

    audio.addEventListener('pause', () => {
        playerStore.update(state => ({ ...state, isPlaying: false }));
    });

    audio.addEventListener('play', () => {
        playerStore.update(state => ({ ...state, isPlaying: true }));
    });
}

export const playerStore = writable<PlayerState>(initialState);
playerStore.subscribe(state => {
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
        } else if (state.type === 'podcast') {
            console.log('playing podcast', state.currentEpisode.url);
            audio.src = state.currentEpisode.url;
            updatePodcastProgress(state.currentPodcast.id, state.currentEpisode.id, 0);
        }
        // Wait for the source to be loaded
        audio.load();
    }

    // Always update volume and playback rate
    audio.volume = state.volume;
    if (state.type === 'podcast' && state.playbackRate) {
        audio.playbackRate = state.playbackRate;
    }
});

export function playRadio(radio: Radio): void {
    playerStore.update((state): RadioPlayerState => ({
        type: 'radio',
        isPlaying: !(audio?.paused ?? true),
        currentTime: 0,
        duration: 0,
        volume: state.volume,
        playbackRate: 1,
        currentRadio: radio,
        currentPodcast: null,
        currentEpisode: null,
        playlist: [],
    }));

    audio?.play();
}
export function playPodcast(podcast: Podcast, startWithEpisode?: Episode, startWithTime: number = 0) {
    const episodeToPlay = startWithEpisode || podcast.items[0];
    if (!episodeToPlay) return;

    playerStore.update((state): PodcastPlayerState => ({
        type: 'podcast',
        isPlaying: !(audio?.paused ?? true),
        currentTime: startWithTime,
        volume: state.volume,
        playbackRate: get(settings).playbackRate,
        currentRadio: null,
        currentPodcast: podcast,
        currentEpisode: episodeToPlay,
        playlist: podcast.items,
        duration: episodeToPlay.duration ? Number(episodeToPlay.duration) : 0,
    }));

    seekTo(startWithTime);
    audio?.play();
}


// Player controls for AUDIO element
export function togglePlayPause() {
    if (audio) {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    }
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
        audio.play();
    }
}


// Player controls for playerStore
export function updateVolume(volume: number) {
    playerStore.update((state) => ({
        ...state,
        volume: Math.max(0, Math.min(1, volume)),
    }));
}
export function updatePlaybackRate(rate: number) {
    playerStore.update((state): PlayerState => {
        if (state.type === 'podcast') {
            settings.update(s => ({ ...s, playbackRate: rate }));
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
            return {
                ...state,
                currentEpisode: nextEpisode,
                duration: Number(nextEpisode.duration),
                currentTime: 0,
                isPlaying: !(audio?.paused ?? true),
            };
        }
        return state;
    });
    if (autoPlay) {
        audio?.play();
    }
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
                isPlaying: !(audio?.paused ?? true),
            };
        }
        return state;
    });
    audio?.play();
}


// UI related functions
export function togglePlaylist() {
    const state = get(playerStore);
    if (state.type === 'podcast' && state.currentPodcast && state.currentEpisode) {
        // Navigate to main page using SvelteKit's goto
        goto('/').then(() => {
            // After navigation, find and expand the podcast
            const podcastElement = document.querySelector(`[data-podcast-id="${state.currentPodcast?.id}"]`);
            if (podcastElement) {
                // Function to find and scroll to episode
                const scrollToEpisode = () => {
                    const episodeButtons = podcastElement.querySelectorAll('button');
                    const episodeElement = Array.from(episodeButtons).find(button => {
                        const titleSpan = button.querySelector('span');
                        return titleSpan && titleSpan.textContent === state.currentEpisode?.title;
                    });
                    if (episodeElement) {
                        episodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Immediately queue the podcast scroll
                        requestAnimationFrame(() => {
                            podcastElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        });
                    }
                };

                // Expand the podcast if not already expanded
                const checkbox = podcastElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
                if (checkbox && !checkbox.checked) {
                    // Get the collapse content element
                    const collapseContent = podcastElement.querySelector('.collapse-content');
                    if (collapseContent) {
                        // Listen for the transition end
                        const onTransitionEnd = () => {
                            collapseContent.removeEventListener('transitionend', onTransitionEnd);
                            scrollToEpisode();
                        };
                        collapseContent.addEventListener('transitionend', onTransitionEnd);
                    }
                    // Trigger the change event properly
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    // If already expanded, just scroll to episode
                    scrollToEpisode();
                }
            }
        });
    } else if (state.type === 'radio' && state.currentRadio) {
        // Navigate to main page using SvelteKit's goto
        goto('/').then(() => {
            // Find the radio card by title
            const radioCard = Array.from(document.querySelectorAll('[role="button"]')).find(
                element => element.querySelector('h3')?.textContent === state.currentRadio?.title
            );
            if (radioCard) {
                radioCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
}
