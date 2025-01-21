<script lang="ts">
	import '../app.css';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import AutoplayLastContent from '$lib/components/AutoplayLastContent.svelte';
	import ContinueListening from '$lib/components/ContinueListening.svelte';
	import InitializePWA from '$lib/components/InitializePWA.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	const outerDivStyle = 'flex flex-col items-center';
	const innerDivStyle = 'container mx-0 sm:mx-5 w-auto flex-col fill-available grow';
</script>

<InitializePWA />
<AutoplayLastContent />

<div class="flex h-dvh w-screen select-none flex-col overflow-hidden bg-base-100">
	<div class="{outerDivStyle} bg-base-200 shadow-md">
		<div class={innerDivStyle}>
			<Navbar />
		</div>
	</div>

	<div class={outerDivStyle}>
		<div class={innerDivStyle}>
			<ContinueListening />
		</div>
	</div>

	<div class="{outerDivStyle} grow overflow-y-auto overflow-x-hidden">
		<div class="{innerDivStyle} space-y-1 px-3 py-2 sm:py-3 sm:py-5">
			<slot></slot>
		</div>
	</div>

	<div class="{outerDivStyle} bg-base-300 shadow-md">
		<div class={innerDivStyle}>
			<AudioPlayer />
		</div>
	</div>
</div>
