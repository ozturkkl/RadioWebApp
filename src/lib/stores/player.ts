import { writable } from 'svelte/store';
import type { Episode, Podcast } from '$lib/util/fetchPodcasts';
import type { Radio } from '$lib/util/fetchRadios';
import { settings } from './settings';
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

export const playerStore = writable<PlayerState>(initialState);

export function playRadio(radio: Radio): void {
    playerStore.update((state): RadioPlayerState => ({
        isPlaying: true,
        currentTime: 0,
        duration: 0,
        volume: state.volume,
        playbackRate: 1,
        type: 'radio',
        currentRadio: radio,
        currentPodcast: null,
        currentEpisode: null,
        playlist: [],
    }));
}

export function playPodcast(podcast: Podcast, startWithEpisode?: Episode) {
    const episodeIndex = startWithEpisode ? podcast.items.findIndex(ep => ep.id === startWithEpisode.id) : 0;
    playerStore.update((state) => ({
        isPlaying: true,
        currentTime: 0,
        duration: Number(podcast.items[episodeIndex].duration),
        volume: state.volume,
        playbackRate: state.playbackRate,
        type: 'podcast',
        currentPodcast: podcast,
        currentEpisode: startWithEpisode || podcast.items[0],
        playlist: podcast.items,
        currentRadio: null,
    }));
}


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

export function togglePlayPause() {
    playerStore.update((state) => ({
        ...state,
        isPlaying: !state.isPlaying,
    }));
}

export function updateTime(time: number) {
    playerStore.update((state) => ({
        ...state,
        currentTime: time,
    }));
}


export function updateVolume(volume: number) {
    playerStore.update((state) => ({
        ...state,
        volume: Math.max(0, Math.min(1, volume)),
    }));
}

export function updatePlaybackRate(rate: number) {
    playerStore.update((state): PlayerState => {
        if (state.type === 'podcast') {
            return { ...state, playbackRate: rate };
        }
        return { ...state, playbackRate: 1 };
    });
}

export function nextTrack() {
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
                isPlaying: true,
            };
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
                isPlaying: true,
            };
        }
        return state;
    });
}

let audio: HTMLAudioElement | undefined;
let seeking = false;

function initAudio() {
    if (audio) return;
    if (typeof window === 'undefined') return; // Skip initialization if not in browser

    audio = new Audio();
    const currentAudio = audio;
    currentAudio.addEventListener('timeupdate', () => {
        if (!seeking) updateTime(currentAudio.currentTime);
    });

    currentAudio.addEventListener('ended', () => {
        const state = get(playerStore);
        const autoplay = get(settings).autoplay;
        
        if (state.type === 'podcast' && autoplay) {
            const currentIndex = state.playlist.findIndex((ep) => ep.id === state.currentEpisode?.id);
            if (currentIndex < state.playlist.length - 1) {
                nextTrack();
            } else {
                // Stop playing if we're at the end of the playlist
                playerStore.update(state => ({ ...state, isPlaying: false }));
            }
        } else {
            // Stop playing if autoplay is off or it's not a podcast
            playerStore.update(state => ({ ...state, isPlaying: false }));
        }
    });

    playerStore.subscribe(state => {
        if (!currentAudio) return;

        console.log('state', state);

        let shouldUpdateSource = false;

        // Check if source needs updating
        if (state.type === 'radio') {
            shouldUpdateSource = !currentAudio.src || currentAudio.src !== state.currentRadio.streamUrl;
        } else if (state.type === 'podcast') {
            shouldUpdateSource = !currentAudio.src || currentAudio.src !== state.currentEpisode.url;
        }

        // Update source if needed
        if (shouldUpdateSource) {
            if (state.type === 'radio') {
                console.log('playing radio', state.currentRadio.streamUrl);
                currentAudio.src = state.currentRadio.streamUrl;
                currentAudio.playbackRate = 1;
            } else if (state.type === 'podcast') {
                console.log('playing podcast', state.currentEpisode.url);
                currentAudio.src = state.currentEpisode.url;
            }
            // Wait for the source to be loaded
            currentAudio.load();
        }

        // Always update volume and playback rate
        currentAudio.volume = state.volume;
        if (state.type === 'podcast') {
            currentAudio.playbackRate = state.playbackRate;
        }

        // Handle play/pause state
        if (state.isPlaying) {
            if (currentAudio.src && currentAudio.paused) {
                setTimeout(() => {
                    if (state.isPlaying) { // Recheck state in case it changed
                        currentAudio.play().catch(error => {
                            console.error('Error playing audio:', error);
                            playerStore.update(state => ({ ...state, isPlaying: false }));
                        });
                    }
                }, 0);
            }
        } else if (!currentAudio.paused) {
            currentAudio.pause();
        }
    });
}

// Initialize audio only in browser environment
if (typeof window !== 'undefined') {
    initAudio();
}

export function setSeekingState(isSeekingState: boolean) {
    seeking = isSeekingState;
}

export function seekTo(time: number) {
    if (audio) {
        audio.currentTime = time;
        updateTime(time);
    }
}

// Clean up function if ever needed
export function cleanup() {
    if (audio) {
        audio.pause();
        audio.src = '';
        audio = undefined;
    }
}

export function skipForward() {
    if (!audio) return;
    const skipAmount = get(settings).skipSeconds;
    const newTime = Math.min(audio.currentTime + skipAmount, audio.duration);
    audio.currentTime = newTime;
    updateTime(newTime);
}

export function skipBackward() {
    if (!audio) return;
    const skipAmount = get(settings).skipSeconds;
    const newTime = Math.max(audio.currentTime - skipAmount, 0);
    audio.currentTime = newTime;
    updateTime(newTime);
}

export function restartRadio() {
    const state = get(playerStore);
    if (state.type === 'radio' && state.currentRadio && audio) {
        const currentUrl = state.currentRadio.streamUrl;
        audio.src = currentUrl;
        audio.load();
        if (state.isPlaying) {
            audio.play();
        }
    }
} 