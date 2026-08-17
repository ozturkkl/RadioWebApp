import { error } from '@sveltejs/kit';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from './$types';
import { config } from '$lib/config';

function hostnameFromValue(value: string | undefined): string | null {
	if (!value) return null;
	try {
		const candidate = value.startsWith('/') ? null : new URL(value);
		return candidate?.hostname ?? null;
	} catch {
		return null;
	}
}

function addHost(hosts: Set<string>, value: string | undefined) {
	const hostname = hostnameFromValue(value);
	if (!hostname) return;
	hosts.add(hostname);
	if (hostname.startsWith('www.')) {
		hosts.add(hostname.slice(4));
	} else {
		hosts.add(`www.${hostname}`);
	}
}

function allowedHostsFromConfig(): Set<string> {
	const hosts = new Set<string>();
	addHost(hosts, config.website.url);
	addHost(hosts, config.podcast.feedUrlsEndpoint);

	for (const radio of config.radios) {
		addHost(hosts, radio.image);
		addHost(hosts, radio.streamUrl);
		if (typeof radio.trackInfo === 'string') {
			addHost(hosts, radio.trackInfo);
		}
		radio.links?.forEach((link) => addHost(hosts, link.url));
	}

	try {
		const feedList = readFileSync(path.join(process.cwd(), 'static', 'feed_urls.txt'), 'utf8');
		for (const line of feedList.split('\n')) {
			const url = line.trim();
			if (url && !url.startsWith('#')) {
				addHost(hosts, url);
			}
		}
	} catch {
		// Local feed list is optional; hosts still come from config.
	}

	return hosts;
}

const ALLOWED_HOSTS = allowedHostsFromConfig();

export const GET: RequestHandler = async ({ url }) => {
	const target = url.searchParams.get('url');
	if (!target) {
		throw error(400, 'Missing url parameter');
	}

	let parsed: URL;
	try {
		parsed = new URL(target);
	} catch {
		throw error(400, 'Invalid url parameter');
	}

	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		throw error(400, 'Unsupported url protocol');
	}

	if (!ALLOWED_HOSTS.has(parsed.hostname)) {
		throw error(403, 'Host is not allowed');
	}

	const response = await fetch(parsed);
	if (!response.ok) {
		throw error(response.status, `Upstream request failed: ${response.statusText}`);
	}

	const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
	const body = await response.arrayBuffer();

	return new Response(body, {
		headers: {
			'content-type': contentType,
			'cache-control': 'public, max-age=60'
		}
	});
};
