<script lang="ts">
	import { pwaInfo } from 'virtual:pwa-info';
	import { deferredInstallPrompt, isInstalled } from '$lib/stores/pwa';
	import type { BeforeInstallPromptEvent } from '$lib/stores/pwa';
	import { onMount } from 'svelte';

	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

	// Set up PWA install prompt listener before mount
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeinstallprompt', ((e: Event) => {
			deferredInstallPrompt.set(e as BeforeInstallPromptEvent);
		}) as EventListener);

		// check if the app is installed previously
		if (window.matchMedia('(display-mode: standalone)').matches) {
			isInstalled.set(true);
		}

		window.addEventListener('appinstalled', () => {
			deferredInstallPrompt.set(null);
			isInstalled.set(true);
		});

		// Check if the app is installed previously
		if (window.matchMedia('(display-mode: standalone)').matches) {
			isInstalled.set(true);
		}

		// check if the app is installed previously
		if (typeof window !== 'undefined' && 'getInstalledRelatedApps' in window.navigator) {
			(window.navigator.getInstalledRelatedApps as () => Promise<any>)().then((apps) => {
				const PWAisInstalled = apps.length > 0;
				if (PWAisInstalled) {
					isInstalled.set(true);
				}
			});
		}
	}

	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				onRegistered(swUrl) {
					console.log('SW registered:', swUrl);

					// uncomment following code if you want check for updates
					// r && setInterval(() => {
					//    console.log('Checking for sw update')
					//    r.update()
					// }, 20000 /* 20s for testing purposes */)
				}
				// onNeedRefresh() {
				// 	console.log('SW update available');
				// },
				// onOfflineReady() {
				// 	console.log('SW ready to work offline');
				// }
			});
		}
	});
</script>

<svelte:head>
	{@html webManifestLink}
</svelte:head>
