import type { Radio } from '$lib/stores/radio/radios';
import type { Podcast } from '$lib/stores/podcast/podcasts';
import { config } from '$lib/config/config';

export function generateAppKeywords(data: { radios: Radio[]; podcasts: Podcast[] }): string[] {
	const keywords = new Set<string>();

	// Add keywords from config first
	if (config.website.keywords) {
		config.website.keywords.forEach((keyword) => keywords.add(keyword.toLowerCase()));
	}

	// Add radio-related keywords
	data.radios.forEach((radio) => {
		// Add radio title words as keywords
		radio.title
			.toLowerCase()
			.split(/\W+/)
			.filter((w) => w.length > 3)
			.forEach((word) => keywords.add(word));
	});

	// Add podcast-related keywords
	data.podcasts.forEach((podcast) => {
		// Add categories as keywords
		podcast.categories.forEach((cat) => keywords.add(cat.toLowerCase()));

		// Add significant words from podcast titles
		podcast.title
			.toLowerCase()
			.split(/\W+/)
			.filter((w) => w.length > 3)
			.forEach((word) => keywords.add(word));
	});

	const categories = [...new Set(data.podcasts.flatMap((p) => p.categories))];
	categories.forEach((cat) => keywords.add(cat.toLowerCase()));

	return Array.from(keywords);
}

export function createPodcastSchema(podcast: Podcast) {
	return {
		'@context': 'https://schema.org',
		'@type': 'PodcastSeries',
		name: podcast.title,
		description: podcast.description,
		image: podcast.imageUrl,
		url: podcast.rssUrl,
		webFeed: podcast.rssUrl,
		episodes: podcast.items.map((episode) => ({
			'@type': 'PodcastEpisode',
			name: episode.title,
			description: episode.description || '',
			duration: episode.duration || '',
			url: episode.url,
			datePublished: episode.pubDate || ''
		}))
	};
}

export function createRadioStationSchema(radio: Radio) {
	return {
		'@context': 'https://schema.org',
		'@type': 'RadioStation',
		name: radio.title,
		url: radio.streamUrl,
		image: radio.image,
		audio: {
			'@type': 'AudioObject',
			contentUrl: radio.streamUrl,
			encodingFormat: 'audio/mpeg'
		},
		potentialAction: {
			'@type': 'ListenAction',
			target: radio.streamUrl
		}
	};
}
