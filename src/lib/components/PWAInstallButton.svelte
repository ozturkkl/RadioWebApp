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

{#if $deferredInstallPrompt}
	<TouchableButton onClick={installPWA} ariaLabel="Install as app" circle={false}>
		<Download class="mr-2 h-5 w-5" />
		Install
	</TouchableButton>
{:else if $isInstalled}
	<TouchableButton
		buttonClassName="text-success"
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
{:else}
	<p class="text-info">Can't automatically install in current browser</p>
{/if}
