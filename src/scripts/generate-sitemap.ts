import fs from 'fs';
import path from 'path';
import { config } from '../lib/config/config';

const BASE_URL = config.website.url;

// Define your routes here - add all your static routes
const routes = [
    '/',
    '/settings',
    // Add other static routes
];

function generateSitemap() {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${routes
        .map(
            (route) => `
    <url>
        <loc>${BASE_URL}${route}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>${route === '/' ? '1.0' : '0.8'}</priority>
    </url>`
        )
        .join('')}
</urlset>`;

    fs.writeFileSync(path.join(process.cwd(), 'static', 'sitemap.xml'), sitemap);
    console.log('Sitemap generated successfully!');
}

function generateRobotsTxt() {
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml
`;

    fs.writeFileSync(path.join(process.cwd(), 'static', 'robots.txt'), robotsTxt);
    console.log('robots.txt generated successfully!');
}

generateSitemap();
generateRobotsTxt(); 