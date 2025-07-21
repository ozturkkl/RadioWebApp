<script lang="ts" context="module">
	export const cardStyles = {
		container:
			'relative w-full rounded-lg border border-1 border-base-300 bg-base-200 shadow transition-all hover:shadow-xl',
		hoverScale: 'hover:scale-[1.02]',
		content: {
			wrapper: 'flex min-w-0 gap-2 sm:gap-4',
			image: 'h-24 w-24 rounded-lg object-cover',
			textContainer: 'w-0 flex-1',
			title: 'truncate text-lg font-bold text-base-content pr-5 mt-1',
			description: 'text-base-content-secondary line-clamp-2 pr-2'
		}
	} as const;
</script>

<script lang="ts">
	import { radioFavorites } from '$lib/stores/radio/radioFavorites';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import { getIconComponent } from '$lib/util/getIconComponent';
	import { playerStore } from '$lib/stores/player';
	import type { Radio } from '$lib/stores/radio/radios';
	import { shareRadio } from '$lib/util/share';
	import { t } from '$lib/i18n';
	import { get } from 'svelte/store';
	import TouchableButton from '$lib/components/utility/TouchableButton.svelte';
	import { Link } from 'lucide-svelte';

	async function shareRadioLink() {
		if (typeof window === 'undefined') return;
		const success = await shareRadio(radio.id ?? radio.title);
		if (success) {
			alert(get(t).player.linkCopied);
		} else {
			alert(get(t).player.linkCopyFailed);
		}
	}

	export let radio: Radio;

	$: trackDescription =
		radio.trackInfo.artist || radio.trackInfo.title
			? `${radio.trackInfo.artist ? radio.trackInfo.artist + ' - ' : ''}${radio.trackInfo.title}`
			: undefined;
</script>

<div
	class="{cardStyles.container} {cardStyles.hoverScale}"
	on:click={() => playerStore.playRadio(radio)}
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			playerStore.playRadio(radio);
		}
	}}
	role="button"
	tabindex="0"
>
	<FavoriteButton
		isFavorite={$radioFavorites[radio.title]}
		onClick={() => radioFavorites.toggleRadio(radio.title)}
	/>
	<div class={cardStyles.content.wrapper}>
		<img src={radio.image} alt={`${radio.title} radio image`} class={cardStyles.content.image} />
		<div class={cardStyles.content.textContainer}>
			<h3 class={cardStyles.content.title}>{radio.title}</h3>
			{#if trackDescription}
				<p class={cardStyles.content.description}>
					{trackDescription}
				</p>
			{/if}
		</div>
		<div class="flex items-center">
			<div class="divider divider-horizontal m-0 w-1 p-0"></div>

			<div class="my-auto grid grid-flow-col grid-rows-[repeat(2,_auto)] place-items-center">
				<TouchableButton ariaLabel={$t.player.shareRadio} onClick={shareRadioLink} circle={false} small={true}>
					<Link class="h-5 w-5" />
				</TouchableButton>
				{#if radio.links && radio.links.length > 0}
					{#each radio.links as link}
						<TouchableButton
							onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
							ariaLabel={link.iconLabel}
							circle={false}
							small={true}
						>
							<svelte:component this={getIconComponent(link.iconLabel)} class="h-5 w-5" />
						</TouchableButton>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>
