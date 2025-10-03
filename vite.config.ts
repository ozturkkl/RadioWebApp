import 'dotenv/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { config } from './src/lib/config/config';
import fs from 'fs';
import path from 'node:path';
import { imageSize } from 'image-size';
import { getEnv } from './src/lib/util/env';

export default defineConfig(({ mode }) => {
	const isProd = mode === 'production';
	const splash = getEnv('SPLASH_SCREEN_COLOR')?.replace(/^#/, '');

	return {
		esbuild: {
			drop: isProd ? ['debugger'] : [],
			pure: isProd
				? ['console.log', 'console.debug', 'console.info', 'console.trace', 'console.warn']
				: []
		},
		plugins: [
			sveltekit(),
			SvelteKitPWA({
				registerType: 'prompt',
				strategies: 'generateSW',
				workbox: {
					clientsClaim: false,
					skipWaiting: false,
					navigateFallback: undefined
				},
				manifestFilename: 'manifest.json',
				manifest: {
					name: config.website.title,
					short_name: config.website.title,
					start_url: '/',
					display: 'standalone',
					display_override: ['standalone', 'minimal-ui'],
					id: '/',
					orientation: 'portrait',
					scope: '/',
					lang: 'tr',
					description: config.website.description,
					theme_color: `#${splash}`,
					background_color: `#${splash}`,
					categories: ['education'],
					prefer_related_applications: false,
					related_applications: [
						{
							platform: 'webapp',
							url: config.website.url + '/manifest.json'
						}
					],
					icons: [
						{
							src: 'pwa/192x192.png',
							sizes: '192x192',
							type: 'image/png'
						},
						{
							src: 'pwa/512x512.png',
							sizes: '512x512',
							type: 'image/png'
						},
						{
							src: 'pwa/512x512-maskable.png',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'maskable'
						},
						{
							src: 'pwa/192x192-maskable.png',
							sizes: '192x192',
							type: 'image/png',
							purpose: 'maskable'
						}
					],
					screenshots: (() => {
						const dir = path.join('static', 'screenshots');
						if (!fs.existsSync(dir))
							return [] as {
								src: string;
								type?: string;
								sizes: string;
								form_factor?: 'narrow' | 'wide';
							}[];
						const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f));
						return files
							.map((file) => {
								const full = path.join(dir, file);
								const dims = imageSize(fs.readFileSync(full));
								if (!dims) return null;
								const sizes = `${dims.width}x${dims.height}`;
								const item: {
									src: string;
									type?: string;
									sizes: string;
									form_factor?: 'narrow' | 'wide';
								} = {
									src: `screenshots/${encodeURIComponent(file)}`,
									type: dims.type === 'png' ? 'image/png' : 'image/jpeg',
									sizes,
									form_factor: (dims.width ?? 0) > (dims.height ?? 0) ? 'wide' : 'narrow'
								};
								return item;
							})
							.filter(
								(
									s
								): s is {
									src: string;
									type?: string;
									sizes: string;
									form_factor?: 'narrow' | 'wide';
								} => Boolean(s)
							);
					})()
				}
			})
		],
		build: {
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				onwarn(warning, warn) {
					if (warning.message.includes('but also statically imported by')) return;
					warn(warning);
				}
			}
		}
	};
});
