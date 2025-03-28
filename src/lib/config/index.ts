import * as Icons from 'lucide-svelte';

export interface WebsiteConfig {
	title: string;
	description: string;
	url: string;
	keywords?: string[];
	links: {
		iconLabel: keyof typeof Icons;
		url: string;
	}[];
	externalLinks: {
		label: string;
		iconLabel: keyof typeof Icons;
		url: string;
	}[];
}

export interface PodcastConfig {
	feedUrlsEndpoint: string;
	bypassCategories: string[];
}

export interface RadioConfig {
	title: string;
	image: string;
	streamUrl: string;
	links?: {
		iconLabel: keyof typeof Icons;
		url: string;
	}[];
	trackInfo:
		| string
		| {
				cover: string;
				artist: string;
				title: string;
		  };
}

export interface Config {
	website: WebsiteConfig;
	podcast: PodcastConfig;
	radios: RadioConfig[];
}
export * from './config';
