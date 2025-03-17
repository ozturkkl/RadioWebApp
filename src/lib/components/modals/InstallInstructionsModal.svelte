<script lang="ts">
	import Modal from '$lib/components/modals/Modal.svelte';
	import { isIOS, detectBrowser, type BrowserType } from '$lib/util/browserUtils';
	import {
		PlusCircle,
		Download,
		AlertCircle,
		Menu,
		MoreHorizontal,
		MoreVertical,
		Share
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { Icon } from 'lucide-svelte';
	import { t } from '$lib/i18n';
	import { formatString } from '$lib/i18n/format';

	const modalId = 'install_instructions_modal';
	let modalComponent: Modal;
	let browserType: BrowserType;

	// Helper functions to get browser-specific UI information
	function getMenuIcon(): typeof Icon {
		switch (browserType) {
			case 'Chrome':
				return MoreVertical;
			case 'Edge':
				return MoreHorizontal;
			case 'Safari':
				return Share;
			default:
				return Menu;
		}
	}

	function getMenuPosition(): string {
		switch (browserType) {
			case 'Chrome':
			case 'Edge':
				return $t.installModal.menuPositions.chromeEdge;
			default:
				return $t.installModal.menuPositions.default;
		}
	}

	function getInstallInstructions(): string {
		switch (browserType) {
			case 'Chrome':
				return $t.installModal.generic.chromeInstall;
			case 'Edge':
				return $t.installModal.generic.edgeInstall;
			default:
				return $t.installModal.generic.defaultInstall;
		}
	}

	export function open() {
		if (modalComponent) {
			modalComponent.open();
		}
	}

	export function close() {
		if (modalComponent) {
			modalComponent.close();
		}
	}

	onMount(() => {
		browserType = detectBrowser();
	});
</script>

<Modal
	id={modalId}
	title={isIOS() ? $t.installModal.installOnIOS : $t.installModal.installOnAndroid}
	maxHeight="80vh"
	bind:this={modalComponent}
>
	<div class="overflow-y-auto p-5 pt-2">
		{#if isIOS()}
			<div class="space-y-4">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<svelte:component this={getMenuIcon()} class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.step1}</p>
						<p>
							{$t.installModal.ios.shareButton}
							<span class="text-xs">{$t.installModal.ios.shareButtonNote}</span>
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<PlusCircle class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.step2}</p>
						<p>{$t.installModal.ios.addToHomeScreen}</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<Download class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.step3}</p>
						<p>{$t.installModal.ios.finishInstall}</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<p class="text-sm text-base-content/70">
						{$t.installModal.notes.appOnHomeScreen}
					</p>
					<p class="mt-2 text-sm text-base-content/70">
						<strong>{$t.installModal.notes.important}:</strong>
						{$t.installModal.notes.safariChromeOnly}
					</p>
				</div>
			</div>
		{:else if browserType === 'Firefox'}
			<div class="space-y-4">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-warning p-2">
						<AlertCircle class="h-5 w-5 text-warning-content" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.firefox.limitation}</p>
						<p>
							{$t.installModal.firefox.noSupport}
						</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<p class="text-sm text-base-content/70">
						{$t.installModal.firefox.useAlternative}
					</p>
					<ul class="mt-2 list-disc pl-5 text-sm text-base-content/70">
						<li>{$t.installModal.browsers.chrome}</li>
						<li>{$t.installModal.browsers.edge}</li>
						<li>{$t.installModal.browsers.safari}</li>
						<li>{$t.installModal.browsers.samsung}</li>
					</ul>
					<p class="mt-2 text-sm text-base-content/70">
						<strong>Tip:</strong>
						{$t.installModal.notes.mostBrowsersSupport}
					</p>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<svelte:component this={getMenuIcon()} class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.step1}</p>
						<p>
							{formatString($t.installModal.generic.menuButton, {
								browser: browserType === 'Unknown' ? 'your browser' : browserType
							})}
						</p>
						<p class="text-xs text-base-content/70">
							({formatString($t.installModal.generic.menuPosition, {
								position: getMenuPosition()
							})})
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<Download class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.step2}</p>
						<p>
							{getInstallInstructions()}
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<PlusCircle class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.step3}</p>
						<p>{$t.installModal.generic.tapInstall}</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<p class="text-sm text-base-content/70">
						{$t.installModal.notes.appOnHomeScreen}
					</p>
					{#if browserType !== 'Chrome'}
						<p class="mt-2 text-sm text-base-content/70">
							<strong>Tip:</strong>
							{$t.installModal.notes.tryChrome}
						</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</Modal>
