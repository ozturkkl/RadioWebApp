function buildPodcastShareUrl(
	origin: string,
	podcastId: string,
	episodeId: string,
	timeSeconds?: number
): string {
	const url = new URL('/', origin);
	url.searchParams.set('podcast', podcastId);
	url.searchParams.set('episode', episodeId);
	if (timeSeconds && timeSeconds > 0) {
		url.searchParams.set('t', Math.floor(timeSeconds).toString());
	}
	return url.toString();
}

function buildRadioShareUrl(origin: string, radioId: string): string {
	const url = new URL('/', origin);
	url.searchParams.set('radio', radioId);
	return url.toString();
}

export async function sharePodcast(podcastId: string, episodeId?: string, timeSeconds: number = 0) {
	const origin = typeof window !== 'undefined' ? window.location.origin : '';
	if (!origin) return '';
	const firstEpisodeId = episodeId ?? '';
	const url = buildPodcastShareUrl(origin, podcastId, firstEpisodeId, timeSeconds);
	return url;
}

export async function shareRadio(radioId: string) {
	const origin = typeof window !== 'undefined' ? window.location.origin : '';
	if (!origin) return '';
	const url = buildRadioShareUrl(origin, radioId);
	return url;
}

export async function copyTextToClipboard(text: string) {
	if (!text) return;
	await navigator.clipboard.writeText(text);
	return text;
}
