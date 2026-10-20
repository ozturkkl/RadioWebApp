import { get, writable } from 'svelte/store';
import { XMLParser } from 'fast-xml-parser';
import { config } from '$lib/config';
import { indexedDbCache } from '$lib/util/indexedDbCache';
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
	externalUrl?: string;
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

function rssText(value: unknown): string | undefined {
	if (typeof value === 'string' || typeof value === 'number') return String(value);
	if (value && typeof value === 'object' && '#text' in value) {
		return rssText((value as { '#text': unknown })['#text']);
	}
	return undefined;
}

function externalHttpUrl(value: unknown): string | undefined {
	const text = rssText(value);
	if (!text) return undefined;

	try {
		const url = new URL(text);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
	} catch {
		return undefined;
	}
}

export async function getPodcastRssUrls() {
	const feedsUrl = config.podcast.feedUrlsEndpoint;
	const res = await withBackoff(
		async () => {
			const response = await fetch(feedsUrl, { cache: 'no-store' });
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
	return text
		.split('\n')
		.map((url) => url.trim())
		.filter((url) => url.length > 0 && !url.startsWith('#'));
}

export async function fetchPodcast(url: string): Promise<Podcast | null> {
	try {
		const response = await withBackoff(
			async () => {
				const response = await fetch(url, { cache: 'no-store' });
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
		const externalUrlValue = channel['redirect:url'];
		const externalUrl = externalHttpUrl(externalUrlValue);
		if (externalUrlValue !== undefined && !externalUrl) {
			console.error(`Skipping feed ${url}: Invalid external URL`);
			return null;
		}

		if (!externalUrl && !channel.item?.length) {
			console.error(`Skipping feed ${url}: No episodes found`);
			return null;
		}

		const podcast: Podcast = {
			title: channel.title,
			imageUrl: channel['itunes:image']?.href || channel.image?.url,
			description: channel['itunes:summary'] || channel.description,
			id: channel['podcast:guid'] || url, // Use URL as fallback ID
			items: externalUrl
				? []
				: // eslint-disable-next-line @typescript-eslint/no-explicit-any
					channel.item.map((item: any) => {
						const episode: Episode = {
							id: rssText(item.guid) || item.enclosure?.url || item.link,
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
			externalUrl,
			lastFetched: Date.now()
		};
		return podcast;
	} catch (error) {
		console.error(`Error processing RSS feed ${url}:`, error);
		return null;
	}
}

// Limit how many RSS feeds are fetched/parsed at the same time to reduce peak
// memory usage on low-RAM devices.
const FETCH_CONCURRENCY = 10;
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const CACHE_KEY = 'podcasts';

// Timestamp lives with the data so a fresh timestamp can never point at a missing cache.
interface PodcastCache {
	podcasts: Podcast[];
	refreshedAt: number;
}

function orderPodcasts(
	feedUrls: string[],
	fetched: Map<string, Podcast>,
	existing: Podcast[]
): Podcast[] {
	const existingByUrl = new Map(existing.map((podcast) => [podcast.rssUrl, podcast]));
	const ordered: Podcast[] = [];
	for (const url of feedUrls) {
		const podcast = fetched.get(url) ?? existingByUrl.get(url);
		if (podcast) ordered.push(podcast);
	}
	return ordered;
}

function createPodcastsStore() {
	const store = writable<Podcast[]>([]);
	const { subscribe, set } = store;
	let refreshInFlight = false;
	let lastRefreshAt = 0;

	async function loadCache() {
		try {
			const cached = await indexedDbCache.read<PodcastCache>(CACHE_KEY);
			if (!cached?.podcasts.length) return;
			set(cached.podcasts);
			lastRefreshAt = cached.refreshedAt;
		} catch (error) {
			console.error('Error reading podcast cache', error);
		}
	}

	function saveCache(podcasts: Podcast[]) {
		const cache: PodcastCache = { podcasts, refreshedAt: lastRefreshAt };
		void indexedDbCache.write(CACHE_KEY, cache).catch((error) => {
			console.error('Error writing podcast cache', error);
		});
	}

	async function refresh(force = false) {
		if (refreshInFlight) return;
		if (!force && Date.now() - lastRefreshAt < REFRESH_INTERVAL_MS) return;

		refreshInFlight = true;

		try {
			const feedUrls = await getPodcastRssUrls();
			const fetchedPodcastMap = new Map<string, Podcast>();

			const throttledUpdate = throttleDebounce(
				() => set(orderPodcasts(feedUrls, fetchedPodcastMap, get(store))),
				500,
				false,
				true
			);

			let nextIndex = 0;
			async function worker() {
				while (nextIndex < feedUrls.length) {
					const url = feedUrls[nextIndex++];
					try {
						const podcast = await fetchPodcast(url);

						if (podcast) {
							fetchedPodcastMap.set(url, podcast);
							throttledUpdate();
						}
					} catch (error) {
						console.error(`Error processing podcast ${url}:`, error);
					}
				}
			}

			const workers = Array.from({ length: Math.min(FETCH_CONCURRENCY, feedUrls.length) }, () =>
				worker()
			);
			await Promise.all(workers);

			const refreshed = orderPodcasts(feedUrls, fetchedPodcastMap, get(store));
			set(refreshed);

			// Skip saving when every feed failed, but do save an intentionally empty feed list.
			if (fetchedPodcastMap.size > 0 || feedUrls.length === 0) {
				lastRefreshAt = Date.now();
				saveCache(refreshed);
			}
		} catch (error) {
			console.error('Error refreshing podcasts', error);
		} finally {
			refreshInFlight = false;
		}
	}

	let ready = Promise.resolve();
	if (typeof window !== 'undefined') {
		ready = loadCache().then(() => refresh());
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') refresh();
		});
	}

	return {
		subscribe,
		// Resolves once the initial cache load and feed refresh have finished.
		ready
	};
}

export const podcasts = createPodcastsStore();
