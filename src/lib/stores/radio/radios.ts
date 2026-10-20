import { get, writable } from 'svelte/store';
import { config } from '$lib/config';
import type { IconLabel } from '$lib/util/getIconComponent';

export interface Radio {
	id: string;
	title: string;
	image: string;
	streamUrl: string;
    links?: {
        iconLabel: IconLabel;
        url: string;
    }[];
	trackInfo: {
		cover: string;
		artist: string;
		title: string;
	};
}

function createRadiosStore() {
	const store = writable<Radio[]>([]);
	const { subscribe, set, update } = store;

	async function fetchFreshRadios(): Promise<Radio[]> {
		return config.radios.map((radio) => ({
			...radio,
			id: radio.title,
			trackInfo: {
				cover: radio.image,
				artist: '',
				title: ''
			}
		}));
	}

	async function updateTrackInfo(radio: Radio): Promise<Radio | null> {
		const configRadio = config.radios.find((r) => r.title === radio.title);
		if (typeof configRadio?.trackInfo === 'string') {
			try {
				const response = await fetch(configRadio.trackInfo);
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
		const updatedRadios = await Promise.all(get(store).map(updateTrackInfo));
		const updatedById = new Map(
			updatedRadios.filter((radio) => radio !== null).map((radio) => [radio.id, radio])
		);
		update((radios) => radios.map((radio) => updatedById.get(radio.id) ?? radio));
	}

	async function refresh() {
		set(await fetchFreshRadios());
	}

	// Start background updates immediately
	if (typeof window !== 'undefined') {
		setInterval(refreshTrackInfo, 10000);
		refresh().then(() => refreshTrackInfo());
	}

	return {
		subscribe
	};
}

export const radios = createRadiosStore();
