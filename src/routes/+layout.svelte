<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { config } from '$lib/config';
	import { playerStore } from '$lib/stores/player';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import * as Icons from 'lucide-svelte';

	type IconName = keyof typeof Icons;
	const getIconComponent = (name: IconName) => {
		return Icons[name] as unknown as typeof Icons.Icon;
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
		<div class="container mx-auto flex items-center justify-between px-4 py-2 sm:py-4">
			<div class="flex items-center gap-4">
				{#if $showBackButton}
					<button
						onclick={() => window.history.back()}
						class="text-base-content-secondary hover:text-base-content"
						aria-label="Go back"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</button>
				{/if}
				<a href="/" class="text-2xl font-bold text-base-content">{config.website.title}</a>
			</div>

			<!-- Social Links -->
			<div class="flex items-center gap-4">
				{#each config.website.links as link}
					<a
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-base-content-secondary hover:text-base-content"
					>
						<span class="sr-only">{link.iconLabel}</span>
						<svelte:component this={getIconComponent(link.iconLabel)} class="h-6 w-6" />
					</a>
				{/each}
				
				<a
					href="/settings"
					class="text-base-content-secondary hover:text-base-content"
					aria-label="Settings"
				>
					<Icons.Settings class="h-6 w-6" />
				</a>
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
