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
			case 'Firefox':
			case 'Opera':
			case 'Unknown':
			default:
				return Menu;
		}
	}

	function getMenuPosition(): string {
		switch (browserType) {
			case 'Chrome':
				return 'three dots in the top right';
			case 'Edge':
				return 'three dots in the top right';
			case 'Firefox':
				return 'three lines in the top right';
			case 'Safari':
				return 'share button at the bottom';
			case 'Opera':
			case 'Unknown':
			default:
				return 'usually three dots or lines in the corner';
		}
	}

	function getInstallInstructions(): string {
		switch (browserType) {
			case 'Chrome':
				return 'Tap "Cast, save, and share" and "Install page as app..."';
			case 'Edge':
				return 'Tap "Apps" and then "install this site as an app"';
			case 'Safari':
				return 'Tap "Add to Home Screen"';
			case 'Opera':
			case 'Unknown':
			default:
				return 'Look for "Install app" or "Add to Home screen"';
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
	bind:this={modalComponent}
>
	<div class="overflow-y-auto p-5 pt-1">
		{#if isIOS()}
			<div class="space-y-4">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<svelte:component this={getMenuIcon()} class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.step1}</p>
						<p>
							{$t.installModal.tapShareButton} <span class="text-xs"
								>{$t.installModal.squareWithArrow}</span
							>
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<PlusCircle class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.step2}</p>
						<p>{$t.installModal.addToHomeScreen}</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<Download class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">{$t.installModal.step3}</p>
						<p>{$t.installModal.editNameAndAdd}</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<p class="text-sm text-base-content/70">
						{$t.installModal.appOnHomeScreen}
					</p>
					<p class="mt-2 text-sm text-base-content/70">
						<strong>Important:</strong> {$t.installModal.worksSafariChrome}
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
						<p class="font-medium">{$t.installModal.firefoxLimitation}</p>
						<p>
							{$t.installModal.firefoxNoSupport}
						</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<p class="text-sm text-base-content/70">
						{$t.installModal.useOtherBrowser}
					</p>
					<ul class="mt-2 list-disc pl-5 text-sm text-base-content/70">
						<li>{$t.installModal.chromeRecommended}</li>
						<li>{$t.installModal.edge}</li>
						<li>{$t.installModal.safariIOS}</li>
						<li>{$t.installModal.samsungInternet}</li>
					</ul>
					<p class="mt-2 text-sm text-base-content/70">
						<strong>Tip:</strong> {$t.installModal.modernBrowsers}
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
						<p>{$t.installModal.tapMenuButton} {browserType === 'Unknown' ? 'your browser' : browserType}</p>
						<p class="text-xs text-base-content/70">
							({getMenuPosition()})
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
						<p>{$t.installModal.tapInstall}</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<p class="text-sm text-base-content/70">
						{$t.installModal.appOnHomeScreen}
					</p>
					{#if browserType !== 'Chrome'}
						<p class="mt-2 text-sm text-base-content/70">
							<strong>Tip:</strong> {$t.installModal.tipUseChrome}
						</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</Modal>
