<script lang="ts">
	import { goto, onNavigate } from '$app/navigation';
	import { ChevronLeft, Settings, SquareArrowOutUpRight } from 'lucide-svelte';
	import Logo from '$lib/components/Logo.svelte';
	import TouchableButton from '$lib/components/TouchableButton.svelte';
	import { config } from '$lib/config/config';
	import { getIconComponent } from '$lib/util/getIconComponent';
	import { writable } from 'svelte/store';
	import ExternalLinksModal from '$lib/components/ExternalLinksModal.svelte';
	import { onMount } from 'svelte';

	const showBackButton = writable(false);
	let externalLinksModal: ExternalLinksModal;

	onMount(() => {
		showBackButton.set(window.location.pathname !== '/');
	});

	onNavigate((navigation) => {
		showBackButton.set(navigation.to?.url.pathname !== '/');
	});
</script>

<div class="flex justify-between">
	<div class="flex items-center">
		<TouchableButton
			onClick={() => ($showBackButton ? window.history.back() : goto('/'))}
			ariaLabel="Go back"
			circle={false}
			buttonClassName="shadow-none px-1"
			small
		>
			{#if $showBackButton}
				<ChevronLeft class="w-[32px]" />
			{:else}
				<Logo className="h-full w-[32px] text-base-content" />
			{/if}
		</TouchableButton>
		<a href="/" class={`text-l z-10 pl-0 font-bold text-base-content sm:text-2xl`}>
			{config.website.title}
		</a>
	</div>

	<!-- Social Links -->
	<div class="flex items-center">
		{#each config.website.links as link}
			<TouchableButton
				onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
				buttonClassName="shadow-none"
				ariaLabel={link.iconLabel}
				circle={false}
				small
			>
				<svelte:component this={getIconComponent(link.iconLabel)} class="h-5 w-5 sm:h-6 sm:w-6" />
			</TouchableButton>
		{/each}

		<TouchableButton
			onClick={() => externalLinksModal.open()}
			buttonClassName="shadow-none"
			ariaLabel="Other Links"
			circle={false}
			small
		>
			<SquareArrowOutUpRight class="h-5 w-5 sm:h-6 sm:w-6" />
		</TouchableButton>

		<TouchableButton
			onClick={() => goto('/settings')}
			ariaLabel="Settings"
			buttonClassName="shadow-none"
			circle={false}
			small
		>
			<Settings class="h-5 w-5 sm:h-6 sm:w-6" />
		</TouchableButton>
	</div>
</div>

<ExternalLinksModal bind:this={externalLinksModal} />
