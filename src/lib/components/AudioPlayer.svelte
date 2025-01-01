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

	const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
</script>

{#if $playerStore.type}
	<div
		class="fixed bottom-0 left-0 right-0 z-50 bg-base-300 shadow-lg"
		role="presentation"
		on:click|stopPropagation|preventDefault
	>
		<div class="container mx-auto">
			<!-- Now Playing Info Row -->
			<div
				class="flex items-center justify-between gap-2 border-b border-base-200"
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
					size="md"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"
						/>
					</svg>
				</TouchableButton>
			</div>

			<!-- Controls Row -->
			<div class="flex flex-col">
				<!-- All Controls in One Row -->
				<div class="flex items-stretch justify-between" role="presentation">
					<!-- Left Side Controls -->
					<div class="flex items-stretch pl-1">
						{#if $playerStore.type === 'podcast'}
							<!-- Playback Speed -->
							<div class="dropdown dropdown-top" on:click|stopPropagation role="presentation">
								<TouchableButton
									onClick={() => {}}
									ariaLabel="Playback speed"
									size="sm"
									className="h-full"
								>
									<span class="text-xs font-bold sm:text-sm">{$playerStore.playbackRate}x</span>
								</TouchableButton>
								<div class="dropdown-content z-[1] rounded-box bg-base-200 p-2 shadow-lg">
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
							<TouchableButton onClick={restartRadio} ariaLabel="Refresh radio stream" size="sm">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
								</svg>
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
									size="sm"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"
										/>
									</svg>
								</TouchableButton>
							{/if}

							<TouchableButton
								onClick={skipBackward}
								disabled={$playerStore.currentTime === 0 && $playerStore.duration !== 0}
								ariaLabel="Skip backward {$settings.skipSeconds} seconds"
								size="sm"
							>
								<div class="relative">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
									</svg>
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
								size="md"
							>
								{#if $playerStore.isPlaying}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-8 w-8"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
											clip-rule="evenodd"
										/>
									</svg>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-8 w-8"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</TouchableButton>

							<TouchableButton
								onClick={skipForward}
								disabled={$playerStore.duration === $playerStore.currentTime &&
									$playerStore.duration !== 0}
								ariaLabel="Skip forward {$settings.skipSeconds} seconds"
								size="sm"
							>
								<div class="relative">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
									</svg>
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
									size="sm"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"
										/>
									</svg>
								</TouchableButton>
							{/if}
						</div>
					</div>

					<!-- Right Side Controls -->
					<div class="flex items-stretch pr-1">
						<!-- Volume Control -->
						<div class="dropdown dropdown-top" on:click|stopPropagation role="presentation">
							<TouchableButton
								onClick={() => {}}
								ariaLabel="Volume control"
								size="sm"
								className="h-full"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071a1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243a1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z"
										clip-rule="evenodd"
									/>
								</svg>
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

				<!-- Seek Bar (only for podcasts) -->
				{#if $playerStore.type === 'podcast'}
					<div class="mb-3 mt-1 flex items-center gap-2 text-xs" role="presentation">
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
			</div>
		</div>
	</div>
{/if}
