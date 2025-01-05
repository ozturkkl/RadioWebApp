<script lang="ts">
	import { settings, themes } from '$lib/stores/settings';
	import DropdownSelect from '$lib/components/DropdownSelect.svelte';
	import PWAInstallButton from '$lib/components/PWAInstallButton.svelte';

	const themeOptions = themes.map((theme) => ({ value: theme, label: theme }));
	const skipOptions = [5, 10, 15, 30].map((seconds) => ({
		value: seconds,
		label: `${seconds} seconds`
	}));
</script>

<div class="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
	<h1 class="mb-4 text-2xl font-bold sm:mb-6">Settings</h1>

	<div class="space-y-4 rounded-lg bg-base-200 p-3 shadow-md sm:space-y-6 sm:p-6">
		<!-- Install App Button -->
		<PWAInstallButton />

		<!-- Theme Selector -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">Theme</h3>
				<p class="text-base-content/70">Choose your preferred theme</p>
			</div>
			<DropdownSelect bind:value={$settings.theme} options={themeOptions} />
		</label>

		<!-- Autoplay -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">Autoplay</h3>
				<p class="text-base-content/70">Automatically play next episode</p>
			</div>
			<input type="checkbox" bind:checked={$settings.autoplay} class="toggle toggle-primary" />
		</label>

		<!-- Autoplay Last Content -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">Resume Last Content</h3>
				<p class="text-base-content/70">
					Automatically play your last played radio or podcast when opening the app
				</p>
			</div>
			<input
				type="checkbox"
				bind:checked={$settings.autoplayLastContent}
				class="toggle toggle-primary"
			/>
		</label>

		<!-- Auto-close Collapse -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">Auto-close Podcasts</h3>
				<p class="text-base-content/70">Automatically close other podcasts when expanding one</p>
			</div>
			<input type="checkbox" bind:checked={$settings.autoCollapse} class="toggle toggle-primary" />
		</label>

		<!-- Skip Seconds -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">Skip Duration</h3>
				<p class="text-base-content/70">Amount of seconds to skip when using the skip buttons</p>
			</div>
			<DropdownSelect bind:value={$settings.skipSeconds} options={skipOptions} />
		</label>
	</div>
</div>
