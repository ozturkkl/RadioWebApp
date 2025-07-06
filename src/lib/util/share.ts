export function buildPodcastShareUrl(
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

export function buildRadioShareUrl(origin: string, radioId: string): string {
	const url = new URL('/', origin);
	url.searchParams.set('radio', radioId);
	return url.toString();
}

export async function copyTextToClipboard(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
