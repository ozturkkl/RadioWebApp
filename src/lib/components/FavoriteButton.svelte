<script lang="ts">
	import { Star } from 'lucide-svelte';
	export let isFavorite: boolean;
	export let onClick: () => void;
</script>

<button
	class="absolute left-0 top-0 z-10 rounded-lg bg-base-100/50 p-1 hover:bg-base-100"
	style="border-top-right-radius: 0; border-bottom-right-radius: 10px; border-bottom-left-radius: 0px;"
	on:click|stopPropagation={onClick}
	aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
>
	<Star
		class="h-5 w-5 {isFavorite ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-base-content/50 hover:text-yellow-400'}"
	/>
</button> 