import { withCorsProxy } from './corsProxy';
import { config } from '../config';
import * as Icons from 'lucide-svelte';

export interface Radio {
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

const radios = config.radios;

function getCachedRadios(): Radio[] | null {
	if (typeof window === 'undefined') return null;
	const cached = localStorage.getItem('cached-radios');
	return cached ? JSON.parse(cached) : null;
}

function setCachedRadios(radios: Radio[]) {
	if (typeof window === 'undefined') return;
	localStorage.setItem('cached-radios', JSON.stringify(radios));
}

export async function fetchRadios() {
	// Return cached data immediately if available
	const cached = getCachedRadios();
	if (cached) {
		// Fetch fresh data in the background
		fetchFreshRadios().then(setCachedRadios);
		return cached;
	}

	// If no cache, fetch fresh data
	const freshData = await fetchFreshRadios();
	setCachedRadios(freshData);
	return freshData;
}

async function fetchFreshRadios(): Promise<Radio[]> {
	const radioList: Radio[] = [];

	for (const radio of radios) {
		let trackInfoData =
			typeof radio.trackInfo === 'string'
				? { cover: radio.image, artist: '', title: '' }
				: radio.trackInfo;

		if (typeof radio.trackInfo === 'string') {
			try {
				const response = await fetch(withCorsProxy(radio.trackInfo));
				const data = await response.json();
				trackInfoData = {
					cover: data.cover || radio.image,
					artist: data.artist || '',
					title: data.title || ''
				};
			} catch (error) {
				console.error(`Error fetching track info for ${radio.title}:`, error);
			}
		}

		radioList.push({
			title: radio.title,
			image: radio.image,
			streamUrl: radio.streamUrl,
			links: radio.links,
			trackInfo: trackInfoData
		});
	}

	return radioList;
}
