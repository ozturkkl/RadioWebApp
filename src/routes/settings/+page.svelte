<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { user, signInWithGoogle } from '$lib/stores/auth';
	import DropdownSelect from '$lib/components/DropdownSelect.svelte';
	import PWAInstallButton from '$lib/components/PWAInstallButton.svelte';
	import TouchableButton from '$lib/components/TouchableButton.svelte';
	import { RefreshCw } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { logGoogleUserData } from '$lib/util/googleDriveHelpers';
	import { themes } from '$lib/util/theme';
	import { autoplayLastContent } from '$lib/stores/player';
	const themeOptions = themes.map((theme) => ({ value: theme, label: theme }));
	const skipOptions = [5, 10, 15, 30].map((seconds) => ({
		value: seconds,
		label: `${seconds} seconds`
	}));
	const signingInProgress = writable(true);
	const showSettingsPage = writable(false);

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
</script>

{#if $showSettingsPage}
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

		<!-- Google Sign In -->
		<div class="flex items-center justify-between">
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
		</div>
	</div>
{/if}
