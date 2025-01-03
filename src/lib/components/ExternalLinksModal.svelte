<script lang="ts">
	import TouchableButton from './TouchableButton.svelte';
	import { getIconComponent } from '$lib/util/getIconComponent';
	import { config } from '$lib/config';

	export function open() {
		const modal = document.getElementById('external_links_modal') as HTMLDialogElement;
		modal.showModal();
	}

	export function close() {
		const modal = document.getElementById('external_links_modal') as HTMLDialogElement;
		modal.close();
	}
</script>

<dialog id="external_links_modal" class="modal">
	<div class="modal-box flex max-h-[70vh] max-w-3xl flex-col overflow-hidden p-0">
		<h3 class="px-7 pb-2 pt-4 text-lg font-bold">Other Resources</h3>
		<div class="grid flex-1 grid-cols-1 overflow-x-hidden px-4 pb-2 md:grid-cols-2">
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
		<div class="modal-action mt-0 flex-none border-t border-base-content/15">
			<form method="dialog">
				<TouchableButton
					onClick={() => close()}
					ariaLabel="Close"
					circle={false}
					className="hover:!brightness-90 mx-2">Close</TouchableButton
				>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<style>
	:global(
		:root:has(:is(.modal-open, .modal:target, .modal-toggle:checked + .modal, .modal[open]))
	) {
		scrollbar-gutter: auto !important;
	}
</style>
