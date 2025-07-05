<script lang="ts">
	import {
		playerStore,
		togglePlayPause,
		togglePlaylist,
		seekTo,
		skipForward,
		skipBackward,
		restartRadio
	} from '$lib/stores/player';
	import { settings } from '$lib/stores/settings';
	import TouchableButton from '$lib/components/TouchableButton.svelte';
	import { formatTime } from '$lib/util/time';
	import {
		List,
		RotateCcw,
		SkipBack,
		SkipForward,
		Pause,
		Play,
		Volume2,
		VolumeOff,
		ChevronsLeft,
		TriangleAlert
	} from 'lucide-svelte';
	import DropdownSelect from '$lib/components/DropdownSelect.svelte';
	import { isIOS } from '$lib/util/browserUtils';
	import { iosRangeTouchEventPolyfill } from '$lib/util/iosRangeTouchEventPolyfill';
	import { radios } from '$lib/stores/radio/radios';
	import { t } from '$lib/i18n';
	const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
	const speedSelectOptions = speedOptions.map((speed) => ({ value: speed, label: `${speed}x` }));

	// Get current radio with updated track info
	$: currentRadio =
		$playerStore.type === 'radio' && $playerStore.currentRadio
			? $radios.find((r) => r.id === $playerStore.currentRadio.id)
			: null;
</script>

{#if $playerStore.type}
	<!-- Now Playing Info Row -->
	<div class="flex items-center justify-between gap-2 border-t border-base-200" role="presentation">
		<div class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
			{#if $playerStore.type === 'radio' && currentRadio}
				<img
					src={currentRadio.trackInfo?.cover || currentRadio.image}
					alt={currentRadio.title}
					class="h-8 w-8 rounded object-cover"
				/>
				<div class="min-w-0 flex-1">
					<h3 class="truncate text-sm font-medium">{currentRadio.title}</h3>
					{#if currentRadio.trackInfo.artist || currentRadio.trackInfo.title}
						<p class="truncate text-xs opacity-75">
							{currentRadio.trackInfo.artist
								? currentRadio.trackInfo.artist + ' - '
								: ''}{currentRadio.trackInfo.title}
						</p>
					{/if}
				</div>
			{:else if $playerStore.type === 'podcast' && $playerStore.currentEpisode}
				<img
					src={$playerStore.currentEpisode.image || $playerStore.currentPodcast?.imageUrl}
					alt={$playerStore.currentEpisode.title}
					class="h-8 w-8 rounded object-cover"
				/>
				<div class="min-w-0 flex-1">
					<h3 class="truncate text-sm font-medium">{$playerStore.currentPodcast?.title}</h3>
					<p class="truncate text-xs opacity-75">{$playerStore.currentEpisode.title}</p>
				</div>
			{/if}
		</div>

		<!-- Playlist Button -->
		<TouchableButton
			onClick={togglePlaylist}
			ariaLabel={$playerStore.type === 'radio' ? $t.player.goToRadio : $t.player.goToPodcast}
		>
			<List class="h-6 w-6" />
		</TouchableButton>
	</div>
	<!-- Controls Row -->
	<div class="flex flex-col border-t border-base-200 pb-5">
		<!-- Seek Bar (only for podcasts) -->
		{#if $playerStore.type === 'podcast'}
			<div class="mb-1 mt-4 flex items-center gap-2 text-xs" role="presentation">
				<span class="w-10 text-right">{formatTime($playerStore.currentTime)}</span>
				<input
					type="range"
					min="0"
					max={$playerStore.duration || 100}
					value={$playerStore.currentTime}
					class="range range-xs flex-1"
					on:input|stopPropagation={(e) => seekTo(parseFloat(e.currentTarget.value))}
					on:touchstart|stopPropagation={iosRangeTouchEventPolyfill}
					on:touchmove|stopPropagation={iosRangeTouchEventPolyfill}
					on:pointermove|stopPropagation
				/>
				<span class="w-10">{formatTime($playerStore.duration)}</span>
			</div>
		{/if}

		<!-- All Controls in One Row -->
		<div class="flex items-stretch justify-between" role="presentation">
			<!-- Left Side Controls -->
			<div class="flex items-stretch">
				{#if $playerStore.type === 'podcast'}
					<!-- Playback Speed -->
					<DropdownSelect
						value={$playerStore.playbackRate}
						onChange={(value) => playerStore.setPlaybackRate(parseFloat(value))}
						options={speedSelectOptions}
						dropDirection="top"
						optionTextCenter
						limitHeight={false}
						matchOptionWidth={false}
					>
						<TouchableButton
							ariaLabel={$t.player.playbackSpeed}
							small
							className="pl-3 h-full w-full"
							slot="trigger"
						>
							<span
								class="font-bold {$playerStore.playbackRate.toString().includes('.')
									? 'scale-90 text-xs'
									: ''}">{$playerStore.playbackRate}x</span
							>
						</TouchableButton>
					</DropdownSelect>
				{:else if $playerStore.type === 'radio'}
					<TouchableButton onClick={restartRadio} ariaLabel={$t.player.refreshRadio} small>
						<RotateCcw class="h-6 w-6" />
					</TouchableButton>
				{/if}
			</div>

			<!-- Center Controls -->
			<div class="flex flex-1 items-stretch justify-center">
				<div class="flex items-stretch">
					{#if $playerStore.type === 'podcast'}
						<TouchableButton
							onClick={playerStore.previousTrack}
							disabled={$playerStore.currentEpisode &&
								$playerStore.playlist.findIndex(
									(ep) => ep.id === $playerStore.currentEpisode?.id
								) === 0}
							ariaLabel={$t.player.previousTrack}
							small
						>
							<SkipBack class="h-6 w-6" />
						</TouchableButton>
					{/if}

					<TouchableButton
						onClick={skipBackward}
						disabled={$playerStore.currentTime === 0 && $playerStore.duration !== 0}
						ariaLabel={`${$t.player.skipBackward} ${$settings.skipSeconds} ${$t.settings.seconds}`}
						small
					>
						<ChevronsLeft class="h-6 w-6" />
					</TouchableButton>

					<TouchableButton
						onClick={togglePlayPause}
						ariaLabel={$playerStore.isPlaying ? $t.player.pause : $t.player.play}
					>
						{#if $playerStore.errored}
							<TriangleAlert class="h-8 w-8 pb-px" />
						{:else if $playerStore.isBuffering}
							<span class="loading loading-spinner loading-lg h-8 w-8"></span>
						{:else if $playerStore.isPlaying}
							<Pause class="h-8 w-8" />
						{:else}
							<Play class="h-8 w-8" />
						{/if}
					</TouchableButton>

					<TouchableButton
						onClick={skipForward}
						disabled={$playerStore.duration === $playerStore.currentTime &&
							$playerStore.duration !== 0}
						ariaLabel={`${$t.player.skipForward} ${$settings.skipSeconds} ${$t.settings.seconds}`}
						small
					>
						<ChevronsLeft class="h-6 w-6" style="transform: scaleX(-1)" />
					</TouchableButton>

					{#if $playerStore.type === 'podcast'}
						<TouchableButton
							onClick={playerStore.nextTrack}
							disabled={$playerStore.currentEpisode &&
								$playerStore.playlist.findIndex(
									(ep) => ep.id === $playerStore.currentEpisode?.id
								) ===
									$playerStore.playlist.length - 1}
							ariaLabel={$t.player.nextTrack}
							small
						>
							<SkipForward class="h-6 w-6" />
						</TouchableButton>
					{/if}
				</div>
			</div>

			<!-- Right Side Controls -->
			<div class="flex items-stretch">
				<!-- Volume Control -->
				{#if isIOS()}
					<TouchableButton
						ariaLabel={$t.player.volumeControl}
						small
						className="h-full pr-3"
						onClick={() => playerStore.toggleMuted()}
					>
						{#if $playerStore.muted}
							<VolumeOff class="h-6 w-6" />
						{:else}
							<Volume2 class="h-6 w-6" />
						{/if}
					</TouchableButton>
				{:else}
					<div class="dropdown dropdown-top" on:click|stopPropagation role="presentation">
						<TouchableButton
							ariaLabel={$t.player.volumeControl}
							small
							className="h-full pr-3"
							onClick={() => {
								if ($playerStore.muted && $playerStore.volume > 0) {
									playerStore.toggleMuted(false);
								}
							}}
						>
							{#if $playerStore.volume === 0 || $playerStore.muted}
								<VolumeOff class="h-6 w-6" />
							{:else}
								<Volume2 class="h-6 w-6" />
							{/if}
						</TouchableButton>
						<div
							class="dropdown-content z-[1] mb-2 h-40 w-12 rounded-box bg-base-200 p-3 shadow-lg"
						>
							<div class="relative h-full w-full">
								<input
									type="range"
									min="0"
									max="1"
									step="0.01"
									class="range range-md absolute w-[150px]"
									style="top: 50%; left: 50%; transform: translateX(-50%) translateY(-50%) rotate(-90deg);"
									value={$playerStore.volume}
									on:input|stopPropagation={(e) =>
										playerStore.setVolume(parseFloat(e.currentTarget.value))}
								/>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
