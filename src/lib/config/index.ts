import config from './config.json';

export interface Config {
	website: {
		title: string;
	};
	podcast: {
		feedUrlsEndpoint: string;
	};
	radios: Array<{
		title: string;
		image: string;
		streamUrl: string;
		trackInfo:
			| string
			| {
					cover: string;
					artist: string;
					title: string;
			  };
	}>;
}

export default config as Config;
