import { writable } from 'svelte/store';
import { XMLParser } from 'fast-xml-parser';
import { withCorsProxy } from '$lib/util/corsProxy';
import { config } from '$lib/config';

export interface Podcast {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	items: Episode[];
	categories: string[];
}

export interface Episode {
	id: string;
	title: string;
	url: string;
	duration?: string;
	image?: string;
	description?: string;
	pubDate?: string;
}

function createPodcastsStore() {
	const { subscribe, set } = writable<Podcast[]>([]);

	function getCachedPodcasts(): Podcast[] | null {
		const cached = localStorage.getItem('cached-podcasts');
		return cached ? JSON.parse(cached) : null;
	}

	function setCachedPodcasts(podcasts: Podcast[]) {
		localStorage.setItem('cached-podcasts', JSON.stringify(podcasts));
	}

	async function getPodcastRssUrls() {
		const feedsUrl = config.podcast.feedUrlsEndpoint;
		const res = await fetch(withCorsProxy(feedsUrl));
		const text = await res.text();
		const urls = text.split('\n').map((url) => url.trim());
		return urls;
	}

	async function fetchFreshPodcasts(): Promise<Podcast[]> {
		const feedUrls = await getPodcastRssUrls();
		const podcasts: Podcast[] = [];

		for (const url of feedUrls) {
			try {
				const response = await fetch(withCorsProxy(url));
				const xmlText = await response.text();
				const parser = new XMLParser();
				const parsed = parser.parse(xmlText);

				if (!parsed?.rss?.channel) {
					console.error(`Skipping feed ${url}: Invalid RSS structure`);
					continue;
				}

				const channel = parsed.rss.channel;
				const podcast: Podcast = {
					title: channel.title,
					imageUrl: channel['itunes:image']?.href || channel.image?.url,
					description: channel['itunes:summary'] || channel.description,
					id: channel['podcast:guid'],
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					items: channel.item.map((item: any) => {
						const episode: Episode = {
							id: item.guid,
							title: item.title,
							url: item.enclosure?.url || item.link,
							duration: item['itunes:duration'],
							image: item['itunes:image']?.href || item.image?.url,
							description: item.description || item['itunes:summary'],
							pubDate: item.pubDate
						};
						return episode;
					}),
					categories: Array.isArray(channel.category)
						? channel.category
						: channel.category
							? [channel.category]
							: []
				};
				podcasts.push(podcast);
			} catch (error) {
				console.error(`Error processing RSS feed ${url}:`, error);
				continue;
			}
		}

		return podcasts;
	}

	async function refresh() {
		// Return cached data immediately if available
		const cached = getCachedPodcasts();
		if (cached) {
			set(cached);
		}
		// Fetch fresh data in the background
		const freshData = await fetchFreshPodcasts();
		setCachedPodcasts(freshData);
		set(freshData);
	}

	// Initial load
	if (typeof window !== 'undefined') {
		refresh();
	}

	return {
		subscribe,
		refresh
	};
}

export const podcasts = createPodcastsStore();
