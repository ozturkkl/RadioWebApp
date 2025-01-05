import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { config } from './src/lib/config/config';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			manifestFilename: 'manifest.json',
			manifest: {
				name: config.website.title,
				short_name: config.website.title,
				start_url: '/',
				display: 'standalone',
				description: config.website.description,
				theme_color: '#262626',
				background_color: '#262626',
				related_applications: [
					{
						platform: 'webapp',
						url: config.website.url + '/manifest.json'
					}
				],
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: 'pwa-192x192-maskable.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			}
		})
	]
});
