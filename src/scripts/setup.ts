import 'dotenv/config';
import { writeFileSync } from 'fs';
import fetch from 'node-fetch';

async function setup() {
    try {
        if (!process.env.CONFIG_URL) {
            throw new Error('CONFIG_URL environment variable is not set');
        }
        const response = await fetch(process.env.CONFIG_URL);
        const configText = await response.text();
        writeFileSync('src/lib/config/config.ts', configText, 'utf8');
        console.log('Config file successfully updated');
    } catch (error) {
        console.error('Error updating config file:', error);
        process.exit(1);
    }
}

setup();
