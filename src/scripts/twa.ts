import 'dotenv/config';
import { getEnv } from '$lib/util/env';
import { execFileSync } from 'node:child_process';
import fs from 'fs';
import path from 'node:path';

type Command = 'init' | 'update' | 'build';

function runBubblewrap(cmd: Command) {
	const directory = getEnv('TWA_DIRECTORY');
	const manifestUrl = getEnv('TWA_MANIFEST_URL');

	// Always operate inside the Android project directory; treat it as Bubblewrap's root.
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
	}
	const args: string[] = [cmd, `--directory=.`];
	if (cmd === 'init') {
		args.push(`--manifest=${manifestUrl}`);
	}
	if (cmd !== 'init') {
		args.push(`--manifest=twa-manifest.json`);
	}
	if (cmd === 'update') {
		// get the first passed in arg as the version name
		const versionName = process.argv[3];
		args.push(`--appVersionName=${versionName}`);
	}

	const execCwd = directory;
	const userHome = process.env.USERPROFILE || process.env.HOME || '';
	const bubblewrapSdk = path.join(userHome, '.bubblewrap', 'android_sdk');
	const env = { ...process.env } as Record<string, string>;
	if (!env.ANDROID_HOME) env.ANDROID_HOME = bubblewrapSdk;
	if (env.ANDROID_SDK_ROOT) delete env.ANDROID_SDK_ROOT;

	execFileSync('npx', ['-y', '@bubblewrap/cli', ...args], {
		stdio: 'inherit',
		shell: process.platform === 'win32',
		cwd: execCwd,
		env
	});
}

function memoryConstrainedGradle() {
	// Ensure Gradle runs under constrained memory; Bubblewrap init overwrites gradle.properties
	try {
		const directory = getEnv('TWA_DIRECTORY');
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}

		const propsPath = `${directory}/gradle.properties`;
		if (fs.existsSync(propsPath)) {
			let content = fs.readFileSync(propsPath, 'utf8');
			content = content.replace(
				/org\.gradle\.jvmargs=.*\n?/,
				'org.gradle.jvmargs=-Xmx512m -XX:+UseParallelGC\n'
			);
			if (!/org\.gradle\.daemon=/.test(content)) content += '\norg.gradle.daemon=false\n';
			if (!/org\.gradle\.workers\.max=/.test(content)) content += 'org.gradle.workers.max=1\n';
			fs.writeFileSync(propsPath, content, 'utf8');
		}
	} catch (error) {
		console.error('Error during Bubblewrap build');
		throw error;
	}
}

function main() {
	const sub = process.argv[2] as Command | undefined;
	if (!sub || !['init', 'update', 'build'].includes(sub)) {
		throw new Error('Usage: vite-node src/scripts/twa.ts <init|update|build>');
	}
	memoryConstrainedGradle();
	runBubblewrap(sub);
}

main();
