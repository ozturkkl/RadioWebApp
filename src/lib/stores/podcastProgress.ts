import { writable } from 'svelte/store';

interface EpisodeProgress {
    episodeId: string;
    timestamp: number;
    lastPlayed: number; // Unix timestamp
}

interface PodcastProgress {
    [podcastId: string]: EpisodeProgress;
}

const storedProgress = typeof localStorage !== 'undefined' 
    ? JSON.parse(localStorage.getItem('podcastProgress') || '{}')
    : {};

const podcastProgress = writable<PodcastProgress>(storedProgress);

podcastProgress.subscribe((value) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('podcastProgress', JSON.stringify(value));
    }
});

export const updatePodcastProgress = (
    podcastId: string,
    episodeId: string,
    timestamp: number
) => {
    console.log('updating podcast progress', podcastId, episodeId, timestamp);
    podcastProgress.update((progress) => ({
        ...progress,
        [podcastId]: {
            episodeId,
            timestamp,
            lastPlayed: Date.now(),
        },
    }));
};

export default podcastProgress; 