<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import config from '$lib/config';
	import { playerStore } from '$lib/stores/player';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

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
		<div class="container mx-auto flex items-center justify-between px-4 py-4">
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
			<a
				href="/settings"
				class="text-base-content-secondary hover:text-base-content"
				aria-label="Settings"
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
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
			</a>
		</div>
	</nav>

	<div class="flex-1 overflow-y-auto {$playerStore.type ? 'mb-32' : ''}">
		<slot></slot>
	</div>

	<div class="flex-none">
		<AudioPlayer></AudioPlayer>
	</div>
</div>
