
export interface WebsiteConfig {
	title: string;
	description: string;
	url: string;
	keywords?: string[];
    links: {
        iconLabel: string;
        url: string;
    }[];
    externalLinks: {
        label: string;
        iconLabel: string;
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
        iconLabel: string;
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
