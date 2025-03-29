import { config } from '$lib/config/config';
import { fetchPodcast, getPodcastRssUrls, type Podcast } from '$lib/stores/podcast/podcasts';
import 'dotenv/config';
import { writeFileSync } from 'fs';

// Define a type for the minified podcast data
interface MinifiedPodcast {
    name: string;
    description: string;
    categories: string[];
    episodes: {
        name: string;
    }[];
}

async function generatePodcastSnapshot() {
    try {
        console.log('Generating podcast snapshot...');
        const feedUrls = await getPodcastRssUrls();
        const podcasts: Podcast[] = [];

        // Process all feed URLs sequentially to avoid rate limiting
        for (const url of feedUrls) {
            const podcast = await fetchPodcast(url);
            if (podcast) {
                podcasts.push(podcast);
                console.log(`Processed podcast: ${podcast.title}`);
            }
        }

        // Create minified version for SEO
        const minifiedPodcasts: MinifiedPodcast[] = podcasts.map(podcast => ({
            name: podcast.title,
            description: podcast.description,
            categories: podcast.categories.filter(category => !config.podcast.bypassCategories.includes(category)),
            episodes: podcast.items.map(episode => ({
                name: episode.title,
            }))
        }));
        
        // Write the minified snapshot for SEO to a file
        writeFileSync(
            'src/lib/stores/podcast/podcast-snapshot-seo.json',
            JSON.stringify(minifiedPodcasts),
            'utf8'
        );
        
        console.log('Podcast snapshots generated successfully!');
    } catch (error) {
        console.error('Error generating podcast snapshot:', error);
        process.exit(1);
    }
}

generatePodcastSnapshot(); 