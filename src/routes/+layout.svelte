<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { config } from '$lib/config';
	import { playerStore } from '$lib/stores/player';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import TouchableButton from '$lib/components/TouchableButton.svelte';
	import ExternalLinksModal from '$lib/components/ExternalLinksModal.svelte';
	import { ChevronLeft, Settings, SquareArrowOutUpRight } from 'lucide-svelte';
	import { getIconComponent } from '$lib/util/getIconComponent';
	import Logo from '$lib/components/Logo.svelte';
	import AutoplayLastContent from '$lib/components/AutoplayLastContent.svelte';

	import { pwaInfo } from 'virtual:pwa-info';
	import { deferredInstallPrompt, isInstalled } from '$lib/stores/pwa';
	import type { BeforeInstallPromptEvent } from '$lib/stores/pwa';

	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

	const showBackButton = writable(false);
	let externalLinksModal: ExternalLinksModal;

	// Set up PWA install prompt listener before mount
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeinstallprompt', ((e: Event) => {
			e.preventDefault();
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
		showBackButton.set(window.location.pathname !== '/');

		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
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

	onNavigate((navigation) => {
		showBackButton.set(navigation.to?.url.pathname !== '/');
	});
</script>

<svelte:head>
	{@html webManifestLink}
</svelte:head>

<AutoplayLastContent />

<div class="flex h-screen select-none flex-col bg-base-100">
	<nav class="flex-none bg-base-200 shadow-md">
		<div class="container mx-auto flex items-center justify-between overflow-hidden">
			<div class="flex items-center">
				<TouchableButton
					onClick={() => ($showBackButton ? window.history.back() : goto('/'))}
					ariaLabel="Go back"
					circle={false}
					buttonClassName="shadow-none"
					small
				>
					{#if $showBackButton}
						<ChevronLeft class="w-[32px]" />
					{:else}
						<Logo className="h-full w-[32px] text-base-content" />
					{/if}
				</TouchableButton>
				<a href="/" class={`text-l z-10 mx-[-4px] pl-0 font-bold text-base-content sm:text-2xl`}>
					{config.website.title}
				</a>
			</div>

			<!-- Social Links -->
			<div class="flex items-center">
				{#each config.website.links as link}
					<TouchableButton
						onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
						buttonClassName="shadow-none"
						ariaLabel={link.iconLabel}
						circle={false}
						small
					>
						<svelte:component
							this={getIconComponent(link.iconLabel)}
							class="h-5 w-5 sm:h-6 sm:w-6"
						/>
					</TouchableButton>
				{/each}

				<TouchableButton
					onClick={() => externalLinksModal.open()}
					buttonClassName="shadow-none"
					ariaLabel="Other Links"
					circle={false}
					small
				>
					<SquareArrowOutUpRight class="h-5 w-5 sm:h-6 sm:w-6" />
				</TouchableButton>

				<TouchableButton
					onClick={() => goto('/settings')}
					ariaLabel="Settings"
					buttonClassName="shadow-none"
					circle={false}
					small
				>
					<Settings class="h-5 w-5 sm:h-6 sm:w-6" />
				</TouchableButton>
			</div>
		</div>
	</nav>

	<div
		class="flex-1 overflow-y-auto {$playerStore.type === 'podcast'
			? 'mb-40'
			: $playerStore.type === 'radio'
				? 'mb-32'
				: ''}"
	>
		<slot></slot>
	</div>

	<div class="flex-none">
		<AudioPlayer></AudioPlayer>
	</div>
</div>

<ExternalLinksModal bind:this={externalLinksModal} />
