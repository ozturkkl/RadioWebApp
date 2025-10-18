<!-- Create a new SEO component -->
<script lang="ts">
    // SSR-only SEO props are provided by +layout.server.ts.
    // On the client, we keep this component as a no-op shell to avoid loading
    // large snapshot data into memory.
    import { config } from '$lib/config/config';

    export let keywords: string = (config.website.keywords ?? []).join(', ');
    export let jsonLd = {};

    const title: string = config.website.title;
    const description: string = config.website.description;
    const image: string = '/og-image.png';
</script>

<svelte:head>
	<!-- Basic Meta Tags -->
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />
	<meta name="author" content={config.website.title} />

	<!-- Language Meta Tags -->
	<meta name="language" content="tr, en" />

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

    <!-- JSON-LD Structured Data (SSR-provided) -->
    {#if jsonLd}
        <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
        </script>
    {/if}
</svelte:head>

<!-- Intentionally no hidden duplicate content; rely on SSR fallback and JSON-LD -->
