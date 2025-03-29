import type { Config } from '.';

// ICONS FROM: https://lucide.dev/icons/

export const exampleConfig: Config = {
	website: {
		title: 'My Podcast & Radio Website',
		description: 'My Podcast & Radio Website - A platform for radio streams and audio archives',
		url: 'https://mywebsite.com',
		keywords: [
			'podcast',
			'radio',
			'streaming',
			'music',
			'audio',
			'online radio',
			'web radio',
			'internet radio',
			'podcast player'
		],
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
			},
			{
				label: 'Website',
				iconLabel: 'Globe',
				url: 'https://example.com'
			},
			{
				label: 'Social Media',
				iconLabel: 'Twitter',
				url: 'https://x.com/example'
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
					iconLabel: 'Youtube',
					url: 'https://youtube.com/channel/example1'
				},
				{
					iconLabel: 'Mail',
					url: 'mailto:radio1@example.com'
				}
			],
			trackInfo: 'https://example.com/radio1/track/current'
		},
		{
			title: 'Radio 2',
			image: '/radio2.jpg',
			streamUrl: 'https://example.com/radio2/stream',
			links: [
				{
					iconLabel: 'Globe',
					url: 'https://example.com/radio2'
				},
				{
					iconLabel: 'Twitter',
					url: 'https://x.com/radio2'
				}
			],
			trackInfo: {
				cover: '/radio2.jpg',
				artist: 'Radio 2',
				title: 'Static Title'
			}
		},
		{
			title: 'Music Only',
			image: '/music_radio.jpg',
			streamUrl: 'https://example.com/music/stream',
			trackInfo: 'https://example.com/music/track/current'
		}
	]
};
