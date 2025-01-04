import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			manifest: {
				name: 'Radio Web App',
				short_name: 'Radio App',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				description: 'Your favorite radio and podcast player',
				theme_color: '#262626',
				background_color: '#262626',
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
