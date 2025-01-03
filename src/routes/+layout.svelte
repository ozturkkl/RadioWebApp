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
	import { ChevronLeft, Settings, type Icon } from 'lucide-svelte';
	import * as Icons from 'lucide-svelte';

	type IconName = keyof typeof Icons;
	const getIconComponent = (name: IconName) => {
		return Icons[name] as unknown as typeof Icon;
	};

	const showBackButton = writable(false);

	onMount(() => {
		showBackButton.set(window.location.pathname !== '/');
	});

	onNavigate((navigation) => {
		showBackButton.set(navigation.to?.url.pathname !== '/');
	});
</script>

<div class="flex h-screen select-none flex-col bg-base-100">
	<nav class="flex-none bg-base-200 shadow-md">
		<div class="container mx-auto flex items-center justify-between overflow-hidden">
			<div class="flex items-center gap-4">
				{#if $showBackButton}
					<TouchableButton onClick={() => window.history.back()} ariaLabel="Go back" circle={false}>
						<ChevronLeft class="h-6 w-6" />
					</TouchableButton>
				{/if}
				<a href="/" class="text-2xl font-bold text-base-content pl-4">{config.website.title}</a>
			</div>

			<!-- Social Links -->
			<div class="flex items-center">
				{#each config.website.links as link}
					<TouchableButton
						onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
						ariaLabel={link.iconLabel}
						circle={false}
					>
						<svelte:component this={getIconComponent(link.iconLabel)} class="h-6 w-6" />
					</TouchableButton>
				{/each}

				<TouchableButton onClick={() => goto('/settings')} ariaLabel="Settings" circle={false}>
					<Settings class="h-6 w-6" />
				</TouchableButton>
			</div>
		</div>
	</nav>

	<div class="flex-1 overflow-y-auto {$playerStore.type ? 'mb-40' : ''}">
		<slot></slot>
	</div>

	<div class="flex-none">
		<AudioPlayer></AudioPlayer>
	</div>
</div>
