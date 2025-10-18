import type { LayoutServerLoad } from './$types';
import { config } from '$lib/config/config';
import podcastSnapshotSeo from '$lib/stores/podcast/podcast-snapshot-seo.json';
import { clampText } from '$lib/util/text';

interface MinifiedPodcast {
	name: string;
	description: string;
	categories?: string[];
	episodes: { name: string }[];
}

export const load: LayoutServerLoad = async () => {
	// Build keywords and JSON-LD on the server to avoid loading large data on client
	const podcasts = (podcastSnapshotSeo as MinifiedPodcast[]).map((p) => ({
		...p,
		description: clampText(p.description, 120),
		episodes: (p.episodes ?? []).slice(0, 50)
	}));

	const keywords = [
		...(config.website.keywords ?? []),
		...podcasts.map((p) => p.name),
		...podcasts.flatMap((p) => p.categories || []),
		...config.radios.map((r) => r.title)
	].join(', ');

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: config.website.title,
		description: config.website.description,
		url: config.website.url,
		hasPart: [
			...config.radios.map((radio) => ({
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
			})),
			...podcasts.map((podcast) => ({
				'@context': 'https://schema.org',
				'@type': 'PodcastSeries',
				name: podcast.name,
				description: podcast.description,
				episodes: podcast.episodes.map((episode) => ({
					'@type': 'PodcastEpisode',
					name: episode.name
				}))
			}))
		]
	};

	return {
		seo: {
			keywords,
			jsonLd
		}
	};
};
