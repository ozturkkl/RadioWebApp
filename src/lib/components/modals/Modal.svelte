<script lang="ts">
	import TouchableButton from '$lib/components/TouchableButton.svelte';
	import { X } from 'lucide-svelte';

	export let id: string;
	export let title: string | undefined = undefined;
	export let showCloseButton = true;
	export let maxWidth = '40rem';
	export let maxHeight = '65vh';

	type ButtonType = 'primary' | 'secondary' | 'danger';

	interface ModalButton {
		label: string;
		type?: ButtonType;
		onClick?: () => void;
		closeOnClick?: boolean;
	}

	export let buttons: ModalButton[] = [];

	// If no buttons provided, add a default close button
	$: effectiveButtons =
		buttons.length > 0
			? buttons
			: [{ label: 'Close', type: 'secondary' as ButtonType, closeOnClick: true }];

	export function open() {
		const modal = document.getElementById(id) as HTMLDialogElement;
		modal.removeAttribute('inert');
		modal.showModal();
	}

	export function close() {
		const modal = document.getElementById(id) as HTMLDialogElement;
		modal.close();
		modal.setAttribute('inert', '');
	}

	function handleButtonClick(button: ModalButton) {
		if (button.onClick) {
			button.onClick();
		}
		if (button.closeOnClick) {
			close();
		}
	}

	const buttonClasses: Record<ButtonType, string> = {
		primary: 'btn-primary',
		secondary: 'btn-ghost',
		danger: 'btn-error'
	};
</script>

<dialog {id} class="modal" inert>
	<div class="modal-box flex flex-col overflow-hidden p-0" style="max-width: {maxWidth};">
		{#if showCloseButton}
			<TouchableButton
				onClick={() => close()}
				ariaLabel="Close"
				circle={false}
				buttonClassName="bg-transparent border-none"
				className="absolute right-0 top-0 z-10"
			>
				<X />
			</TouchableButton>
		{/if}

		{#if title}
			<h3 class="p-3 pl-5 pr-14 text-2xl font-bold">{title}</h3>
		{/if}

		<div class="flex min-w-0 flex-1 flex-col overflow-hidden" style="max-height: {maxHeight};">
			<slot />
		</div>

		{#if buttons.length > 0}
			<div class="modal-action mt-0 flex-none border-t border-base-content/15">
				{#each buttons as button}
					<TouchableButton
						onClick={() => handleButtonClick(button)}
						ariaLabel={button.label}
						circle={false}
						buttonClassName={buttonClasses[(button.type || 'secondary') as ButtonType]}
						className="hover:!brightness-90 mx-2"
					>
						{button.label}
					</TouchableButton>
				{/each}
			</div>
		{/if}
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
