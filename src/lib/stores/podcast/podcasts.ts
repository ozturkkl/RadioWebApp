import { writable } from 'svelte/store';
import { XMLParser } from 'fast-xml-parser';
import { config } from '$lib/config';
import { getUserData, setUserData } from '$lib/util/userData';
import { withBackoff } from '$lib/util/backoff';
import { throttleDebounce } from '$lib/util/throttleDebounce';

export interface Podcast {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	items: Episode[];
	categories: string[];
	rssUrl: string;
	lastFetched: number; // Timestamp when this podcast was last fetched
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

export async function getPodcastRssUrls() {
	const feedsUrl = config.podcast.feedUrlsEndpoint;
	const res = await withBackoff(
		async () => {
			const response = await fetch(feedsUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch podcast RSS URLs: ${response.status} ${response.statusText}`
				);
			}
			return response;
		},
		2,
		1000,
		7
	);
	const text = await res.text();
	const urls = text.split('\n').map((url) => url.trim());
	return urls;
}

export async function fetchPodcast(url: string): Promise<Podcast | null> {
	try {
		const response = await withBackoff(
			async () => {
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(
						`Failed to fetch podcast from ${url}: ${response.status} ${response.statusText}`
					);
				}
				return response;
			},
			2,
			1000,
			3
		);
		const xmlText = await response.text();
		const parser = new XMLParser();
		const parsed = parser.parse(xmlText);

		if (!parsed?.rss?.channel) {
			console.error(`Skipping feed ${url}: Invalid RSS structure`);
			return null;
		}

		const channel = parsed.rss.channel;

		if (!channel.item?.length) {
			console.error(`Skipping feed ${url}: No episodes found`);
			return null;
		}

		const podcast: Podcast = {
			title: channel.title,
			imageUrl: channel['itunes:image']?.href || channel.image?.url,
			description: channel['itunes:summary'] || channel.description,
			id: channel['podcast:guid'] || url, // Use URL as fallback ID
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			items: channel.item.map((item: any) => {
				const episode: Episode = {
					id: item.guid || item.enclosure?.url || item.link,
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
					: [],
			rssUrl: url,
			lastFetched: Date.now()
		};
		return podcast;
	} catch (error) {
		console.error(`Error processing RSS feed ${url}:`, error);
		return null;
	}
}

// Cache invalidation time (10 minutes in milliseconds)
const CACHE_INVALIDATION_TIME = 10 * 60 * 1000;

function createPodcastsStore() {
	const { subscribe, set, update } = writable<Podcast[]>([]);

	async function refresh() {
		// Get cached podcasts
		const cachedPodcasts = getUserData('cached-podcasts') as Podcast[];

		// Immediately set cached podcasts to provide instant content
		if (cachedPodcasts.length > 0) {
			set(cachedPodcasts);
		}

		// Get all feed URLs
		const feedUrls = await getPodcastRssUrls();

		// Create a map of cached podcasts for quick lookup
		const cachedPodcastMap = new Map<string, Podcast>();
		cachedPodcasts.forEach((podcast) => {
			if (podcast.rssUrl) cachedPodcastMap.set(podcast.rssUrl, podcast);
		});

		const fetchedPodcastMap = new Map<string, Podcast>();

		// Create a throttled version of the update function
		const throttledUpdate = throttleDebounce(
			() => {
				update((podcasts) => {
					// Create a new array that will maintain the order from feedUrls
					const orderedPodcasts: Podcast[] = [];

					// Create a map of existing podcasts by ID for quick lookup
					const existingPodcastsMap = new Map<string, Podcast>();
					podcasts.forEach((podcast) => {
						existingPodcastsMap.set(podcast.rssUrl, podcast);
					});

					// Process all fetched podcasts in the order they appear in feedUrls
					for (let i = 0; i < feedUrls.length; i++) {
						const url = feedUrls[i];
						const podcast = fetchedPodcastMap.get(url) ?? existingPodcastsMap.get(url);

						if (podcast) {
							orderedPodcasts.push(podcast);
						}
					}

					// Save to local storage with throttling
					setUserData('cached-podcasts', orderedPodcasts.slice(0, 5));

					return orderedPodcasts;
				});
			},
			500, // Update UI at most every 500ms
			false, // Leading call
			true // Trailing call
		);

		// Process all feed URLs concurrently
		feedUrls.forEach(async (url) => {
			try {
				// Check if we have a cached version and if it's still valid
				const cachedPodcast = cachedPodcastMap.get(url);
				const isCacheValid =
					cachedPodcast &&
					cachedPodcast.lastFetched &&
					Date.now() - cachedPodcast.lastFetched < CACHE_INVALIDATION_TIME;

				let podcast: Podcast | null = null;

				if (isCacheValid) {
					// Use cached version
					podcast = cachedPodcast;
				} else {
					// No valid cache, fetch
					podcast = await fetchPodcast(url);
				}

				if (podcast) {
					// Add to processed podcasts
					fetchedPodcastMap.set(url, podcast);
					// Update the UI
					throttledUpdate();
				}
			} catch (error) {
				console.error(`Error processing podcast ${url}:`, error);
			}
		});
	}

	// Initial load
	if (typeof window !== 'undefined') {
		refresh();
	}

	return {
		subscribe
	};
}

export const podcasts = createPodcastsStore();
