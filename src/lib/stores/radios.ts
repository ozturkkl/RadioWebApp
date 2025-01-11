import { writable } from 'svelte/store';
import type { Radio } from '$lib/util/fetchRadios';
import { config } from '$lib/config';
import { withCorsProxy } from '$lib/util/corsProxy';

function createRadiosStore() {
    const { subscribe, set, update } = writable<Radio[]>([]);

    async function updateTrackInfo(radio: Radio): Promise<Radio | null> {
        const configRadio = config.radios.find(r => r.title === radio.title);
        if (typeof configRadio?.trackInfo === 'string') {
            try {
                const response = await fetch(withCorsProxy(configRadio.trackInfo));
                const data = await response.json();
                return {
                    ...radio,
                    trackInfo: {
                        cover: data.cover || radio.image,
                        artist: data.artist || '',
                        title: data.title || ''
                    }
                };
            } catch (error) {
                console.error(`Error fetching track info for ${radio.title}:`, error);
            }
        }
        return null;
    }

    async function refreshTrackInfo() {
        update(radios => {
            radios.forEach(async (radio, index) => {
                const updatedRadio = await updateTrackInfo(radio);
                if (updatedRadio) {
                    radios[index] = updatedRadio;
                }
            });
            return radios;
        });
    }

    // Start background updates immediately
    if (typeof window !== 'undefined') {
        setInterval(refreshTrackInfo, 10000);
    }

    return {
        subscribe,
        set,
        update
    };
}

export const radios = createRadiosStore(); 