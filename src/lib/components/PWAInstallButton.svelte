<script lang="ts">
	import { Check, Download, Share } from 'lucide-svelte';
	import TouchableButton from './TouchableButton.svelte';
	import { deferredInstallPrompt, isInstalled } from '$lib/stores/pwa';

	const isIOS =
		typeof window !== 'undefined' &&
		/iPad|iPhone|iPod/.test(navigator.userAgent) &&
		!(window as any).MSStream;

	async function installPWA() {
		if (!$deferredInstallPrompt) return;

		$deferredInstallPrompt.prompt();
		const { outcome } = await $deferredInstallPrompt.userChoice;
		deferredInstallPrompt.set(null);
	}
</script>

{#if $deferredInstallPrompt || $isInstalled}
	<div class="flex items-center justify-between">
		<div class="flex-shrink">
			<h3 class="text-lg font-medium">Install App</h3>
			<p class="text-base-content/70">Install this app on your device for easier access</p>
		</div>
		<div class="flex-shrink-0">
			{#if $deferredInstallPrompt}
				<TouchableButton
					onClick={installPWA}
					ariaLabel="Install as app"
					circle={false}
					buttonClassName="bg-base-100"
				>
					<Download class="mr-2 h-5 w-5" />
					Install
				</TouchableButton>
			{:else if $isInstalled}
				<TouchableButton
					buttonClassName="text-success shadow-none"
					onClick={() => {}}
					circle={false}
					ariaLabel="App already installed"
				>
					<Check class="mr-2 h-5 w-5" />
					Installed</TouchableButton
				>
			{:else if isIOS}
				<TouchableButton
					buttonClassName="text-info"
					onClick={() => {}}
					circle={false}
					ariaLabel="iOS install instructions"
				>
					<Share class="mr-2 h-5 w-5" />
					Tap Share then 'Add to Home Screen'</TouchableButton
				>
			{/if}
		</div>
	</div>
{/if}
