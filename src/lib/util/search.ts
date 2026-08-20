import type { Podcast } from '$lib/stores/podcast/podcasts';

export type MatchField = 'title' | 'episode';
export type MatchKind = 'exact' | 'similar';

export interface SearchHit {
	podcast: Podcast;
	score: number;
	matchField: MatchField;
	matchKind: MatchKind;
	matchedEpisodeIds: string[];
}

interface FoldedPodcast {
	title: string;
	episodes: { id: string; title: string }[];
}

interface FoldMap {
	folded: string;
	origIndex: number[];
}

const foldedCache = new WeakMap<Podcast, FoldedPodcast>();

const CHAR_FOLD: Record<string, string> = {
	ş: 's',
	ğ: 'g',
	ü: 'u',
	ö: 'o',
	ç: 'c',
	ı: 'i',
	â: 'a',
	î: 'i',
	û: 'u'
};

const APOSTROPHES = /[''`´ʼʾʿ]/;
const FIELD_WEIGHT: Record<MatchField, number> = {
	title: 3,
	episode: 1
};
const FIELD_ORDER: MatchField[] = ['title', 'episode'];

function asText(value: unknown): string {
	if (value == null) return '';
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	if (Array.isArray(value)) return value.map(asText).join(' ');
	if (typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		return Object.values(obj).map(asText).join(' ');
	}
	return '';
}

function stripHtml(input: string): string {
	return input.replace(/<[^>]*>/g, ' ');
}

function foldChar(char: string): string {
	let c = char.toLocaleLowerCase('tr');
	c = CHAR_FOLD[c] ?? c;
	c = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	if (!c) return '';
	if (APOSTROPHES.test(c)) return '';
	if (!/[0-9a-z]/i.test(c) && c.toLowerCase() === c.toUpperCase()) return ' ';
	return c;
}

function foldMapped(input: string): FoldMap {
	let folded = '';
	const origIndex: number[] = [];
	let lastWasSpace = true;

	for (let i = 0; i < input.length; i++) {
		const out = foldChar(input[i]);
		for (const ch of out) {
			if (ch === ' ') {
				if (lastWasSpace) continue;
				lastWasSpace = true;
				folded += ' ';
				origIndex.push(i);
			} else {
				lastWasSpace = false;
				folded += ch;
				origIndex.push(i);
			}
		}
	}

	if (folded.endsWith(' ')) {
		folded = folded.slice(0, -1);
		origIndex.pop();
	}

	return { folded, origIndex };
}

/** Fold text so Turkish/English variants match (ş↔s, ı↔i, Kur'an↔kuran, …). */
export function fold(input: unknown): string {
	const text = stripHtml(asText(input));
	if (!text) return '';
	return foldMapped(text).folded;
}

type TokenKind = 'exact' | 'prefix' | 'infix' | 'fuzzy';

const TOKEN_SCORE: Record<TokenKind, number> = {
	exact: 1,
	prefix: 0.9,
	infix: 0.85,
	fuzzy: 0.5
};

function isWordBoundary(haystack: string, idx: number): boolean {
	return idx === 0 || haystack[idx - 1] === ' ';
}

function isEndBoundary(haystack: string, endIdx: number): boolean {
	return endIdx === haystack.length || haystack[endIdx] === ' ';
}

function kindRank(kind: MatchKind | null): number {
	if (kind === 'exact') return 2;
	if (kind === 'similar') return 1;
	return 0;
}

function isEditDistanceOne(a: string, b: string): boolean {
	if (a === b) return false;
	const la = a.length;
	const lb = b.length;
	if (Math.abs(la - lb) > 1) return false;

	if (la === lb) {
		let diff = 0;
		for (let i = 0; i < la; i++) {
			if (a[i] !== b[i] && ++diff > 1) return false;
		}
		return diff === 1;
	}

	const shorter = la < lb ? a : b;
	const longer = la < lb ? b : a;
	let i = 0;
	let j = 0;
	let skipped = false;
	while (i < shorter.length && j < longer.length) {
		if (shorter[i] === longer[j]) {
			i++;
			j++;
		} else if (skipped) {
			return false;
		} else {
			skipped = true;
			j++;
		}
	}
	return true;
}

function mergeFoldRanges(ranges: [number, number][]): [number, number][] {
	if (ranges.length === 0) return [];
	ranges.sort((a, b) => a[0] - b[0]);
	const merged: [number, number][] = [];
	for (const range of ranges) {
		const last = merged.at(-1);
		if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
		else merged.push([range[0], range[1]]);
	}
	return merged;
}

function findSubstringRanges(haystack: string, needle: string): [number, number][] {
	if (!needle) return [];
	const ranges: [number, number][] = [];
	let from = 0;
	while (from <= haystack.length - needle.length) {
		const idx = haystack.indexOf(needle, from);
		if (idx === -1) break;
		if (needle.length > 1 || isWordBoundary(haystack, idx)) {
			ranges.push([idx, idx + needle.length]);
		}
		from = idx + 1;
	}
	return ranges;
}

function findFuzzyWordRanges(haystack: string, query: string): [number, number][] {
	if (query.length < 5) return [];
	const ranges: [number, number][] = [];
	let start = 0;
	for (let i = 0; i <= haystack.length; i++) {
		if (i < haystack.length && haystack[i] !== ' ') continue;
		if (i > start && isEditDistanceOne(haystack.slice(start, i), query)) {
			ranges.push([start, i]);
		}
		start = i + 1;
	}
	return ranges;
}

function findNeedleRanges(haystack: string, needle: string): [number, number][] {
	return [...findSubstringRanges(haystack, needle), ...findFuzzyWordRanges(haystack, needle)];
}

function tokenKind(haystack: string, query: string): TokenKind | null {
	if (!query || !haystack) return null;

	let foundPrefix = false;
	let foundInfix = false;
	for (const [idx, end] of findSubstringRanges(haystack, query)) {
		const atStart = isWordBoundary(haystack, idx);
		const atEnd = isEndBoundary(haystack, end);
		if (atStart && atEnd) return 'exact';
		if (atStart) foundPrefix = true;
		else if (query.length > 1) foundInfix = true;
	}
	if (foundPrefix) return 'prefix';
	if (foundInfix) return 'infix';
	if (findFuzzyWordRanges(haystack, query).length > 0) return 'fuzzy';
	return null;
}

function toMatchKind(kind: TokenKind | null): MatchKind | null {
	if (!kind) return null;
	return kind === 'exact' ? 'exact' : 'similar';
}

function scoreText(
	haystack: string,
	foldedQuery: string,
	tokens: string[]
): { score: number; kind: MatchKind | null } {
	if (!foldedQuery || !haystack) return { score: 0, kind: null };

	const whole = tokenKind(haystack, foldedQuery);
	if (tokens.length <= 1) {
		return { score: whole ? TOKEN_SCORE[whole] : 0, kind: toMatchKind(whole) };
	}

	const kinds: TokenKind[] = [];
	for (const token of tokens) {
		const kind = tokenKind(haystack, token);
		if (!kind) {
			return { score: whole ? TOKEN_SCORE[whole] : 0, kind: toMatchKind(whole) };
		}
		kinds.push(kind);
	}

	const avg = kinds.reduce((sum, kind) => sum + TOKEN_SCORE[kind], 0) / kinds.length;
	const wholeScore = whole ? TOKEN_SCORE[whole] : 0;
	const kind: MatchKind =
		whole === 'exact' || kinds.every((item) => item === 'exact') ? 'exact' : 'similar';
	return { score: Math.max(wholeScore, avg), kind };
}

function getFoldedPodcast(podcast: Podcast): FoldedPodcast {
	const cached = foldedCache.get(podcast);
	if (cached) return cached;

	const folded: FoldedPodcast = {
		title: fold(podcast.title),
		episodes: (podcast.items ?? []).map((episode) => ({
			id: episode.id,
			title: fold(episode.title)
		}))
	};
	foldedCache.set(podcast, folded);
	return folded;
}

export interface HighlightPart {
	text: string;
	hit: boolean;
}

/** Split `original` into parts so the query match can be emphasized in the UI. */
export function splitHighlight(original: unknown, query: string): HighlightPart[] {
	const text = asText(original);
	if (!text) return [];
	const foldedQuery = fold(query);
	if (!foldedQuery) return [{ text, hit: false }];

	const { folded, origIndex } = foldMapped(text);
	if (!folded || origIndex.length === 0) return [{ text, hit: false }];

	const needles = [foldedQuery, ...foldedQuery.split(' ').filter(Boolean)];
	const foldRanges: [number, number][] = [];
	for (const needle of new Set(needles)) {
		foldRanges.push(...findNeedleRanges(folded, needle));
	}

	const merged = mergeFoldRanges(foldRanges);
	if (merged.length === 0) return [{ text, hit: false }];

	const parts: HighlightPart[] = [];
	let cursor = 0;
	for (const [startFold, endFold] of merged) {
		const origStart = origIndex[startFold];
		let origEnd = origIndex[endFold - 1] + 1;
		while (origEnd < text.length && /[\u0300-\u036f]/.test(text[origEnd])) origEnd++;
		if (origStart > cursor) parts.push({ text: text.slice(cursor, origStart), hit: false });
		parts.push({ text: text.slice(origStart, origEnd), hit: true });
		cursor = origEnd;
	}
	if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
	return parts;
}

export function searchPodcasts(podcasts: Podcast[], query: string): SearchHit[] {
	const foldedQuery = fold(query);
	if (!foldedQuery) return [];

	const tokens = foldedQuery.split(' ').filter(Boolean);

	const hits: (SearchHit & { index: number })[] = [];
	for (let index = 0; index < podcasts.length; index++) {
		const podcast = podcasts[index];
		try {
			const folded = getFoldedPodcast(podcast);
			const titleMatch = scoreText(folded.title, foldedQuery, tokens);

			let bestEpisodeScore = 0;
			let bestEpisodeKind: MatchKind | null = null;
			const matchedEpisodeIds: string[] = [];
			for (const episode of folded.episodes) {
				const episodeMatch = scoreText(episode.title, foldedQuery, tokens);
				if (episodeMatch.score > 0) {
					matchedEpisodeIds.push(episode.id);
					if (episodeMatch.score > bestEpisodeScore) bestEpisodeScore = episodeMatch.score;
					if (kindRank(episodeMatch.kind) > kindRank(bestEpisodeKind)) {
						bestEpisodeKind = episodeMatch.kind;
					}
				}
			}

			const titleKindRank = kindRank(titleMatch.kind);
			const episodeKindRank = kindRank(bestEpisodeKind);
			let matchField: MatchField | null = null;
			if (titleKindRank > episodeKindRank) matchField = 'title';
			else if (episodeKindRank > titleKindRank) matchField = 'episode';
			else if (titleMatch.score > 0) matchField = 'title';
			else if (bestEpisodeScore > 0) matchField = 'episode';
			if (!matchField) continue;

			const matchKind: MatchKind =
				titleMatch.kind === 'exact' || bestEpisodeKind === 'exact' ? 'exact' : 'similar';
			const score = Math.max(
				titleMatch.score * FIELD_WEIGHT.title,
				bestEpisodeScore * FIELD_WEIGHT.episode
			);

			hits.push({ podcast, score, matchField, matchKind, matchedEpisodeIds, index });
		} catch (error) {
			console.error(`Search failed for podcast ${asText(podcast?.id) || podcast?.title}`, error);
		}
	}

	hits.sort((a, b) => {
		const kindDelta = kindRank(b.matchKind) - kindRank(a.matchKind);
		if (kindDelta !== 0) return kindDelta;
		const fieldDelta = FIELD_ORDER.indexOf(a.matchField) - FIELD_ORDER.indexOf(b.matchField);
		if (fieldDelta !== 0) return fieldDelta;
		if (b.score !== a.score) return b.score - a.score;
		return a.index - b.index;
	});

	return hits.map(({ index: _index, ...hit }) => hit);
}
