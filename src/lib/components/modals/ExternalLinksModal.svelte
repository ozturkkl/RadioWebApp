<script lang="ts">
	import Modal from '$lib/components/modals/Modal.svelte';
	import TouchableButton from '$lib/components/utility/TouchableButton.svelte';
	import { getIconComponent } from '$lib/util/getIconComponent';
	import { config } from '$lib/config';
	import { t } from '$lib/i18n';

	const modalId = 'external_links_modal';
	let modalComponent: Modal;

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
</script>

<Modal id={modalId} title={$t.modals.externalLinks} bind:this={modalComponent}>
	<div class="grid flex-1 grid-cols-1 overflow-x-hidden p-4 md:grid-cols-2">
		{#each config.website.externalLinks as link}
			<TouchableButton
				onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
				className="hover:!brightness-90"
				buttonClassName="w-full !justify-start gap-2 !px-3 flex-nowrap"
				ariaLabel={link.label}
				circle={false}
			>
				<svelte:component this={getIconComponent(link.iconLabel)} class="h-5 w-5 flex-shrink-0" />
				<span class="truncate text-sm">{link.label}</span>
			</TouchableButton>
		{/each}
	</div>
</Modal>
