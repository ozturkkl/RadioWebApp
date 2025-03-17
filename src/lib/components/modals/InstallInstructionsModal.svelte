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
	title={isIOS() ? 'Install on iOS' : 'Install on Android'}
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
						<p class="font-medium">Step 1</p>
						<p>
							Tap the Share button in Safari or Chrome <span class="text-xs"
								>(square with arrow pointing up)</span
							>
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<PlusCircle class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">Step 2</p>
						<p>Scroll down in the share menu and tap "Add to Home Screen"</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 rounded-full bg-base-300 p-2">
						<Download class="h-5 w-5" />
					</div>
					<div>
						<p class="font-medium">Step 3</p>
						<p>You can edit the name if you want, then tap "Add" in the top right corner</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<p class="text-sm text-base-content/70">
						Note: This app will now appear on your home screen and will run in full-screen mode
						without the browser interface.
					</p>
					<p class="mt-2 text-sm text-base-content/70">
						<strong>Important:</strong> This feature only works in Safari and Chrome. If you're using a different
						browser on iOS, please open this site in Safari or Chrome first.
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
						<p class="font-medium">Firefox Limitation</p>
						<p>
							Unfortunately, Firefox does not support installing websites as Progressive Web Apps
							(PWAs).
						</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<p class="text-sm text-base-content/70">
						To install this app on your device, please use one of these browsers instead:
					</p>
					<ul class="mt-2 list-disc pl-5 text-sm text-base-content/70">
						<li>Chrome (recommended for Android)</li>
						<li>Edge</li>
						<li>Safari (iOS only)</li>
						<li>Samsung Internet</li>
					</ul>
					<p class="mt-2 text-sm text-base-content/70">
						<strong>Tip:</strong> Most modern browsers except Firefox support installing PWAs.
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
						<p class="font-medium">Step 1</p>
						<p>Tap the menu button in {browserType === 'Unknown' ? 'your browser' : browserType}</p>
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
						<p class="font-medium">Step 2</p>
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
						<p class="font-medium">Step 3</p>
						<p>Tap "Install" or "Add" in the prompt that appears</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<p class="text-sm text-base-content/70">
						Note: This app will now appear on your home screen and will run in full-screen mode
						without the browser interface.
					</p>
					{#if browserType !== 'Chrome'}
						<p class="mt-2 text-sm text-base-content/70">
							<strong>Tip:</strong> If you don't see the install option, try using Chrome.
						</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</Modal>
