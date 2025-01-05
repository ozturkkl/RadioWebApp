<script lang="ts">
	import {
		playerStore,
		togglePlayPause,
		updateVolume,
		updatePlaybackRate,
		nextTrack,
		previousTrack,
		togglePlaylist,
		seekTo,
		skipForward,
		skipBackward,
		restartRadio
	} from '$lib/stores/player';
	import { settings } from '$lib/stores/settings';
	import TouchableButton from './TouchableButton.svelte';
	import { formatTime } from '$lib/util/time';
	import { List, RotateCcw, SkipBack, SkipForward, Pause, Play, Volume2 } from 'lucide-svelte';

	const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
</script>

{#if $playerStore.type}
	<div
		class="fixed bottom-0 left-0 right-0 z-50 bg-base-300 shadow-lg"
		role="presentation"
		on:click|stopPropagation|preventDefault
	>
		<div class="container mx-auto pb-3">
			<!-- Now Playing Info Row -->
			<div
				class="flex items-center justify-between gap-2 border-t border-base-200"
				role="presentation"
			>
				<div class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
					{#if $playerStore.type === 'radio' && $playerStore.currentRadio}
						<img
							src={$playerStore.currentRadio.image}
							alt={$playerStore.currentRadio.title}
							class="h-8 w-8 rounded object-cover"
						/>
						<div class="min-w-0 flex-1">
							<h3 class="truncate text-sm font-medium">{$playerStore.currentRadio.title}</h3>
							{#if $playerStore.currentRadio.trackInfo.artist || $playerStore.currentRadio.trackInfo.title}
								<p class="truncate text-xs opacity-75">
									{$playerStore.currentRadio.trackInfo.artist} - {$playerStore.currentRadio
										.trackInfo.title}
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
					ariaLabel={$playerStore.type === 'radio' ? 'Go to radio' : 'Go to podcast'}
				>
					<List class="h-6 w-6" />
				</TouchableButton>
			</div>
			<!-- Controls Row -->
			<div class="flex flex-col border-t border-base-200">
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
							<div class="dropdown dropdown-top" on:click|stopPropagation role="presentation">
								<TouchableButton
									onClick={() => {}}
									ariaLabel="Playback speed"
									small
									className="h-full pl-3"
								>
									<span class="text-xs font-bold sm:text-sm">{$playerStore.playbackRate ?? 1}x</span
									>
								</TouchableButton>
								<div class="dropdown-content z-[1] rounded-box bg-base-200 shadow-lg">
									{#each speedOptions as speed}
										<button
											class="block w-full rounded px-6 py-3 text-base hover:bg-base-300 {speed ===
											$playerStore.playbackRate
												? 'bg-primary text-primary-content'
												: ''}"
											on:click|stopPropagation={() => {
												updatePlaybackRate(speed);
												(document.activeElement as HTMLButtonElement)?.blur();
											}}
										>
											{speed}x
										</button>
									{/each}
								</div>
							</div>
						{:else if $playerStore.type === 'radio'}
							<TouchableButton onClick={restartRadio} ariaLabel="Refresh radio stream" small>
								<RotateCcw class="h-6 w-6" />
							</TouchableButton>
						{/if}
					</div>

					<!-- Center Controls -->
					<div class="flex flex-1 items-stretch justify-center">
						<div class="flex items-stretch">
							{#if $playerStore.type === 'podcast'}
								<TouchableButton
									onClick={previousTrack}
									disabled={$playerStore.currentEpisode &&
										$playerStore.playlist.findIndex(
											(ep) => ep.id === $playerStore.currentEpisode?.id
										) === 0}
									ariaLabel="Previous track"
									small
								>
									<SkipBack class="h-6 w-6" />
								</TouchableButton>
							{/if}

							<TouchableButton
								onClick={skipBackward}
								disabled={$playerStore.currentTime === 0 && $playerStore.duration !== 0}
								ariaLabel="Skip backward {$settings.skipSeconds} seconds"
								small
							>
								<div class="relative">
									<RotateCcw class="h-6 w-6" />
									<span
										class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold"
									>
										{$settings.skipSeconds}
									</span>
								</div>
							</TouchableButton>

							<TouchableButton
								onClick={togglePlayPause}
								ariaLabel={$playerStore.isPlaying ? 'Pause' : 'Play'}
							>
								{#if $playerStore.isPlaying}
									<Pause class="h-8 w-8" />
								{:else}
									<Play class="h-8 w-8" />
								{/if}
							</TouchableButton>

							<TouchableButton
								onClick={skipForward}
								disabled={$playerStore.duration === $playerStore.currentTime &&
									$playerStore.duration !== 0}
								ariaLabel="Skip forward {$settings.skipSeconds} seconds"
								small
							>
								<div class="relative">
									<RotateCcw class="h-6 w-6" style="transform: scaleX(-1)" />
									<span
										class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold"
									>
										{$settings.skipSeconds}
									</span>
								</div>
							</TouchableButton>

							{#if $playerStore.type === 'podcast'}
								<TouchableButton
									onClick={nextTrack}
									disabled={$playerStore.currentEpisode &&
										$playerStore.playlist.findIndex(
											(ep) => ep.id === $playerStore.currentEpisode?.id
										) ===
											$playerStore.playlist.length - 1}
									ariaLabel="Next track"
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
						<div class="dropdown dropdown-top" on:click|stopPropagation role="presentation">
							<TouchableButton
								onClick={() => {}}
								ariaLabel="Volume control"
								small
								className="h-full pr-3"
							>
								<Volume2 class="h-6 w-6" />
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
											updateVolume(parseFloat(e.currentTarget.value))}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
