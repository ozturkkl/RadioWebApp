import type { Config } from '.';

export const exampleConfig: Config = {
	website: {
		title: 'My Podcast & Radio Website',
		links: [
			{
				iconLabel: 'Github',
				url: 'https://github.com/yourusername'
			}
		]
	},
	podcast: {
		// RSS urls should be separated by new lines
		feedUrlsEndpoint: 'https://example.com/feed_urls.txt',
		// Categories to exclude from the dropdown menu in the podcast feed page
		bypassCategories: ['News', 'Technology']
	},
	radios: [
		{
			title: 'Radio 1',
			image: '/radio1.png',
			streamUrl: 'https://example.com/radio1/stream',
			trackInfo: 'https://example.com/radio1/track/current'
		},
		{
			title: 'Radio 2',
			image: '/radio2.jpg',
			streamUrl: 'https://example.com/radio2/stream',
			trackInfo: {
				cover: '/radio2.jpg',
				artist: 'Radio 2',
				title: 'Static Title'
			}
		}
	]
};