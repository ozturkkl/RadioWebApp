import { writable } from 'svelte/store';

interface RadioProgress {
    [radioId: string]: {
        lastPlayed: number; // Unix timestamp
    };
}

const storedProgress = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('radioProgress') || '{}')
    : {};

const radioProgress = writable<RadioProgress>(storedProgress);

radioProgress.subscribe((value) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('radioProgress', JSON.stringify(value));
    }
});

export const updateRadioProgress = (radioId: string) => {
    radioProgress.update((progress) => ({
        ...progress,
        [radioId]: {
            lastPlayed: Date.now(),
        },
    }));
};

export default radioProgress; 