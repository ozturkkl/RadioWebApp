<!-- Create a new SEO component -->
<script lang="ts">
	import { config } from '$lib/config/config';
	import podcastSnapshotSeo from '$lib/stores/podcast/podcast-snapshot-seo.json';
	
	// Define the expected type for the imported podcast snapshot
	interface MinifiedPodcast {
		name: string;
		description: string;
		categories?: string[];
		episodes: {
			name: string;
		}[];
	}
	
	// Cast the imported data to the correct type
	const podcastSnapshot = podcastSnapshotSeo as MinifiedPodcast[];

	const title: string = config.website.title;
	const description: string = config.website.description;
	const image: string = '/og-image.png';

	// Generate static keywords from the snapshot data and config
	const keywords = [
		// Base keywords from config
		...(config.website.keywords ?? []),
		// Podcast keywords
		...podcastSnapshot.map(podcast => podcast.name),
		// Podcast categories
		...podcastSnapshot.flatMap(podcast => podcast.categories || []),
		// Radio keywords
		...config.radios.map(radio => radio.title)
	].join(', ');
</script>

<svelte:head>
	<!-- Basic Meta Tags -->
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />
	<meta name="author" content={config.website.title} />
	
	<!-- Language Meta Tags -->
	<meta name="content-language" content="tr, en" />
	<meta name="language" content="Turkish, English" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={config.website.url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:site_name" content={config.website.title} />
	<meta property="og:locale" content="tr_TR" />
	<meta property="og:locale:alternate" content="en_US" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={config.website.url} />
	<meta property="twitter:title" content={title} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={image} />

	<!-- Canonical URL -->
	<link rel="canonical" href={config.website.url} />

	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">
		{JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: config.website.title,
			description: config.website.description,
			url: config.website.url,
			hasPart: [
				// Add radio schemas from config
				...config.radios.map(radio => ({
					'@context': 'https://schema.org',
					'@type': 'RadioStation',
					name: radio.title,
					url: radio.streamUrl,
					image: radio.image,
					audio: {
						'@type': 'AudioObject',
						contentUrl: radio.streamUrl,
						encodingFormat: 'audio/mpeg'
					},
					potentialAction: {
						'@type': 'ListenAction',
						target: radio.streamUrl
					}
				})),
				// Add podcast schemas from static snapshot for initial SEO
				...podcastSnapshot.map(podcast => ({
					'@context': 'https://schema.org',
					'@type': 'PodcastSeries',
					name: podcast.name,
					description: podcast.description,
					episodes: podcast.episodes.map(episode => ({
						'@type': 'PodcastEpisode',
						name: episode.name
					}))
				}))
			]
		})}
	</script>
</svelte:head>

<!-- Hidden SEO Content -->
<div style="display:none;" aria-hidden="true">
	<h1>Featured Podcasts</h1>
	{#each podcastSnapshot as podcast}
		<article>
			<h2>{podcast.name}</h2>
			<p>{podcast.description}</p>
			{#if podcast.categories && podcast.categories.length > 0}
				<div>
					<h3>Categories:</h3>
					<ul>
						{#each podcast.categories as category}
							<li>{category}</li>
						{/each}
					</ul>
				</div>
			{/if}
			<h3>Episodes:</h3>
			<ul>
				{#each podcast.episodes as episode}
					<li>{episode.name}</li>
				{/each}
			</ul>
		</article>
	{/each}
	
	<h1>Radio Stations</h1>
	{#each config.radios as radio}
		<article>
			<h2>{radio.title}</h2>
			{#if radio.trackInfo && typeof radio.trackInfo === 'object' && radio.trackInfo.title}
				<p>Currently playing: {radio.trackInfo.title}</p>
			{/if}
			{#if radio.links && radio.links.length > 0}
				<div>
					<h3>Related Links:</h3>
					<ul>
						{#each radio.links as link}
							<li>{link.iconLabel}: {link.url}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</article>
	{/each}
</div>
