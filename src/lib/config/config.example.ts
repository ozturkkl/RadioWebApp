import type { Config } from '.';

export const exampleConfig: Config = {
	website: {
		title: 'My Podcast & Radio Website',
		links: [
			{
				iconLabel: 'Github',
				url: 'https://github.com/yourusername'
			}
		],
		externalLinks: [
			{
				label: 'Youtube',
				iconLabel: 'Youtube',
				url: 'https://youtube.com/c/example'
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
			links: [
				{
					iconLabel: 'Globe',
					url: 'https://example.com/radio1'
				},
				{
					iconLabel: 'Facebook',
					url: 'https://facebook.com/radio1'
				}
			],
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
