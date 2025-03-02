import fs from 'fs';

const configPath = process.env.CONFIG_URL;
console.log('config path:::', configPath);

if (!configPath) {
	throw new Error('CONFIG_URL environment variable is not defined');
}

// download the config file into the config folder
fetch(configPath)
	.then((response) => response.text())
	.then((data) => {
		fs.writeFileSync('./src/lib/config/config.ts', data, { encoding: 'utf-8', flag: 'w' });
	});
