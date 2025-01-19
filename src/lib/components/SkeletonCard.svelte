<script lang="ts">
	export let imageRounded: 'lg' | 'full' = 'lg';
</script>

<div class="w-full rounded-lg border border-base-300 bg-base-200">
	<div class="flex min-w-0 gap-2 sm:gap-4">
		<div class="skeleton h-24 w-24 shrink-0 rounded-{imageRounded}"></div>
		<div class="flex w-full flex-col gap-4 py-2">
			<div class="skeleton h-6 w-3/4"></div>
			<div class="skeleton h-4 w-1/2"></div>
		</div>
	</div>
</div> 