<!-- Create a new SEO component -->
<script lang="ts">
	import { config } from '$lib/config/config';
	import { podcasts } from '$lib/stores/podcast/podcasts';
	import { radios } from '$lib/stores/radio/radios';
	import {
		createPodcastSchema,
		createRadioStationSchema,
		generateAppKeywords
	} from '$lib/util/seo';

	const title: string = config.website.title;
	const description: string = config.website.description;
	const image: string = '/og-image.png';

	// Generate dynamic meta tags based on content
	$: keywords = generateAppKeywords({
		radios: $radios,
		podcasts: $podcasts
	}).join(', ');
</script>

<svelte:head>
	<!-- Basic Meta Tags -->
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />
	<meta name="author" content={config.website.title} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={config.website.url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:site_name" content={config.website.title} />

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
				...$radios.map((radio) => createRadioStationSchema(radio)),
				...$podcasts.map((podcast) => createPodcastSchema(podcast))
			]
		})}
	</script>
</svelte:head>
