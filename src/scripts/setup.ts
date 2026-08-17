import 'dotenv/config';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'node:path';
import fetch from 'node-fetch';
import { getEnv } from '../lib/util/env';

async function fetchText(url: string): Promise<string> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}
	return response.text();
}

async function fetchBinary(url: string): Promise<Buffer> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}
	return Buffer.from(await response.arrayBuffer());
}

function isLocalSource(value: string): boolean {
	return value === 'local' || value === 'file';
}

async function setup() {
	try {
		const configUrl = getEnv('CONFIG_URL');
		const faviconUrl = getEnv('FAVICON_URL');

		if (isLocalSource(configUrl)) {
			const localConfigPath = 'src/lib/config/config.local.ts';
			const configText = readFileSync(localConfigPath, 'utf8');
			writeFileSync('src/lib/config/config.ts', configText, 'utf8');
			console.log('Config file copied from local config');
		} else {
			const configText = await fetchText(configUrl);
			writeFileSync('src/lib/config/config.ts', configText, 'utf8');
			console.log('Config file successfully updated');
		}

		const faviconPath = path.join('static', 'favicon.png');
		mkdirSync(path.dirname(faviconPath), { recursive: true });

		const snapshotPath = 'src/lib/stores/podcast/podcast-snapshot-seo.json';
		try {
			readFileSync(snapshotPath);
		} catch {
			writeFileSync(snapshotPath, '[]\n', 'utf8');
			console.log('Created empty podcast SEO snapshot for local development');
		}

		if (isLocalSource(faviconUrl)) {
			const localFaviconPath = path.join('static', 'favicon.local.png');
			copyFileSync(localFaviconPath, faviconPath);
			console.log('Favicon copied from local file');
		} else {
			const faviconBuffer = await fetchBinary(faviconUrl);
			writeFileSync(faviconPath, faviconBuffer);
			console.log('Favicon successfully updated');
		}
	} catch (error) {
		console.error('Error during setup:', error);
		process.exit(1);
	}
}

setup();
