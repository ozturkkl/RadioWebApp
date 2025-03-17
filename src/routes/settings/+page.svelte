<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { user, signInWithGoogle } from '$lib/stores/auth';
	import DropdownSelect from '$lib/components/DropdownSelect.svelte';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { themes } from '$lib/util/theme';
	import { autoplayLastContent } from '$lib/stores/player';
	import { deferredInstallPrompt, isInstalled } from '$lib/stores/pwa';
	import TouchableButton from '$lib/components/TouchableButton.svelte';
	import { Check, Download } from 'lucide-svelte';
	import InstallInstructionsModal from '$lib/components/modals/InstallInstructionsModal.svelte';
	import { languages, t } from '$lib/i18n';

	const themeOptions = themes.map((theme) => ({ value: theme, label: theme }));
	const languageOptions = Object.entries(languages).map(([code, name]) => ({
		value: code,
		label: name
	}));
	const skipOptions = [5, 10, 15, 30].map((seconds) => ({
		value: seconds,
		label: `${seconds} seconds`
	}));
	const signingInProgress = writable(true);
	const showSettingsPage = writable(false);
	let installInstructionsModal: InstallInstructionsModal;

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		const state = params.get('state');
		if (code && state) {
			const { playAfterLogin, gotoAfterLogin } = JSON.parse(state);
			showSettingsPage.set(gotoAfterLogin === '/settings');

			await fetch('/auth', {
				method: 'POST',
				body: JSON.stringify({ code, state })
			});
			await user.initAuth();
			goto(gotoAfterLogin ?? '/settings');
			if (playAfterLogin) {
				autoplayLastContent();
			}
			signingInProgress.set(false);
		} else {
			showSettingsPage.set(true);
			signingInProgress.set(false);
		}
	});

	async function installPWA() {
		if (!$deferredInstallPrompt) return;

		$deferredInstallPrompt.prompt();
		const { outcome } = await $deferredInstallPrompt.userChoice;
		deferredInstallPrompt.set(null);
	}
</script>

<InstallInstructionsModal bind:this={installInstructionsModal} />

{#if $showSettingsPage}
	<h1 class="mb-4 text-2xl font-bold sm:mb-6">{$t.settings.title}</h1>

	<div class="space-y-4 rounded-lg bg-base-200 p-3 shadow-md sm:space-y-6 sm:p-6">
		<!-- Install App Button -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">{$t.settings.installApp}</h3>
				<p class="text-base-content/70">{$t.settings.installAppDescription}</p>
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
						{$t.settings.installApp}
					</TouchableButton>
				{:else if $isInstalled}
					<TouchableButton
						buttonClassName="text-success shadow-none"
						onClick={() => {}}
						circle={false}
						ariaLabel="App already installed"
					>
						<Check class="mr-2 h-5 w-5" />
						{$t.settings.alreadyInstalled}</TouchableButton
					>
				{:else}
					<TouchableButton
						buttonClassName="text-info"
						onClick={() => installInstructionsModal.open()}
						circle={false}
						ariaLabel="Install instructions"
					>
						<Download class="mr-2 h-5 w-5" />
						{$t.settings.installApp}</TouchableButton
					>
				{/if}
			</div>
		</label>

		<!-- Language Selector -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">{$t.settings.language}</h3>
				<p class="text-base-content/70">Choose your preferred language</p>
			</div>
			<DropdownSelect
				value={$settings.language}
				onChange={(value) => settings.updateSettings({ language: value as keyof typeof languages })}
				options={languageOptions}
			/>
		</label>

		<!-- Theme Selector -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">{$t.settings.theme}</h3>
				<p class="text-base-content/70">Choose your preferred theme</p>
			</div>
			<DropdownSelect
				value={$settings.theme}
				onChange={(value) => settings.updateSettings({ theme: value })}
				options={themeOptions}
			/>
		</label>

		<!-- Autoplay -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">{$t.settings.autoplay}</h3>
				<p class="text-base-content/70">{$t.settings.autoplayDescription}</p>
			</div>
			<input
				type="checkbox"
				checked={$settings.autoplay}
				on:change={(e: Event) =>
					settings.updateSettings({ autoplay: (e.target as HTMLInputElement).checked })}
				class="toggle toggle-primary"
			/>
		</label>

		<!-- Autoplay Last Content -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">{$t.settings.resumeLastContent}</h3>
				<p class="text-base-content/70">
					{$t.settings.resumeLastContentDescription}
				</p>
			</div>
			<input
				type="checkbox"
				checked={$settings.autoplayLastContent}
				on:change={(e: Event) =>
					settings.updateSettings({
						autoplayLastContent: (e.target as HTMLInputElement).checked
					})}
				class="toggle toggle-primary"
			/>
		</label>

		<!-- Auto-close Collapse -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">{$t.settings.autoClosePodcasts}</h3>
				<p class="text-base-content/70">{$t.settings.autoClosePodcastsDescription}</p>
			</div>
			<input
				type="checkbox"
				checked={$settings.autoCollapse}
				on:change={(e: Event) =>
					settings.updateSettings({ autoCollapse: (e.target as HTMLInputElement).checked })}
				class="toggle toggle-primary"
			/>
		</label>

		<!-- Skip Seconds -->
		<label class="flex cursor-pointer items-center justify-between">
			<div>
				<h3 class="text-lg font-medium">{$t.settings.skipDuration}</h3>
				<p class="text-base-content/70">{$t.settings.skipDurationDescription}</p>
			</div>
			<DropdownSelect
				value={$settings.skipSeconds}
				onChange={(value) => settings.updateSettings({ skipSeconds: Number(value) })}
				options={skipOptions}
			/>
		</label>

		<!-- Google Sign In -->
		<!-- <div class="flex items-center justify-between">
			<div>
				<div class="flex items-center gap-2">
					<h3 class="text-lg font-medium">Google Account</h3>
					{#if $user}
						<TouchableButton
							onClick={() => {
								logGoogleUserData();
							}}
							circle={false}
							className="transition-all hover:rotate-180 duration-300 -m-2"
							buttonClassName="bg-transparent"
							ariaLabel="Sync data with Google"
						>
							<RefreshCw class="h-4 w-4 cursor-pointer text-success" />
						</TouchableButton>
					{/if}
				</div>
				<p class="text-base-content/70">
					{#if $user}
						Signed in as {$user.email}
					{:else}
						Sign in to sync your progress across devices
					{/if}
				</p>
			</div>
			{#if $user}
				<div class="grow-1 flex flex-wrap items-center justify-end">
					<TouchableButton
						onClick={async () => {
							await user.signOut();
							await signInWithGoogle(true);
						}}
						circle={false}
						className="!p-0"
						buttonClassName="bg-transparent"
						ariaLabel="Change User"
					>
						Change User
					</TouchableButton>
					<TouchableButton
						onClick={user.signOut}
						circle={false}
						buttonClassName="bg-base-100"
						ariaLabel="Sign out"
					>
						Sign out
					</TouchableButton>
				</div>
			{:else}
				<TouchableButton
					onClick={() => {
						if ($signingInProgress) return;
						signingInProgress.set(true);
						signInWithGoogle();
					}}
					circle={false}
					buttonClassName="bg-base-100"
					ariaLabel="Sign in with Google"
				>
					{#if $signingInProgress}
						<div class="loading loading-spinner loading-md mr-1"></div>
						Processing...
					{:else}
						Sign in with Google
					{/if}
				</TouchableButton>
			{/if}
		</div> -->
	</div>
{/if}
