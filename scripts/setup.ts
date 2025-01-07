import fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env file (going up one directory since we're in scripts/)
dotenv.config();

//grab config path from .env
const configPath = process.env.CONFIG_PATH;
console.log('config path:::', configPath);

if (!configPath) {
	throw new Error('CONFIG_PATH environment variable is not defined in .env file');
}

// download the config file into the config folder
fetch(configPath)
	.then((response) => response.text())
	.then((data) => {
		fs.writeFileSync('./src/lib/config/config.ts', data, { encoding: 'utf-8', flag: 'w' });
	});
