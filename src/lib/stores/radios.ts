import { writable } from 'svelte/store';
import { config } from '$lib/config';
import { withCorsProxy } from '$lib/util/corsProxy';
import * as Icons from 'lucide-svelte';
import { getUserData, setUserData } from '$lib/util/userData';

export interface Radio {
	id: string;
	title: string;
	image: string;
	streamUrl: string;
	links?: {
		iconLabel: keyof typeof Icons;
		url: string;
	}[];
	trackInfo: {
		cover: string;
		artist: string;
		title: string;
	};
}

function createRadiosStore() {
	const { subscribe, set, update } = writable<Radio[]>([]);

	function setCachedRadios(radios: Radio[]) {
		// Strip out the trackInfo when caching
		const cachedRadios = radios.map((radio) => ({
			...radio,
			trackInfo: {
				cover: radio.image,
				artist: '',
				title: ''
			}
		}));
		setUserData('cached-radios', cachedRadios);
	}

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
		update((radios) => {
			radios.forEach(async (radio, index) => {
				const updatedRadio = await updateTrackInfo(radio);
				if (updatedRadio) {
					radios[index] = updatedRadio;
				}
			});
			return radios;
		});
	}

	async function refresh() {
		const cached = getUserData('cached-radios');
		if (cached.length > 0) {
			set(cached);
		}
		const freshData = await fetchFreshRadios();
		setCachedRadios(freshData);
		set(freshData);
	}

	// Start background updates immediately
	if (typeof window !== 'undefined') {
		setInterval(refreshTrackInfo, 10000);
		refresh().then(() => refreshTrackInfo());
	}

	return {
		subscribe,
		set,
		update
	};
}

export const radios = createRadiosStore();
