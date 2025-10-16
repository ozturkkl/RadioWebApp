import 'dotenv/config';
import fs from 'fs-extra';
import path from 'node:path';

async function deploy() {
    try {
        const buildPath = 'build';
        const args = process.argv.slice(2);
        const isBeta = args.includes('--beta');
        const envPath = process.env.DEPLOY_BUILD_PATH;

        if (!envPath) {
            throw new Error('DEPLOY_BUILD_PATH environment variable is not set');
        }

        // Normalize env path and optionally append -beta to last folder name
        const normalizedEnvPath = envPath.replace(/[\\/]+$/, '');
        const parsed = path.parse(normalizedEnvPath);
        const baseFolder = parsed.base;
        const betaFolder = `${baseFolder}-beta`;
        const deployPath = isBeta ? path.join(parsed.dir || parsed.root, betaFolder) : normalizedEnvPath;

        // Ensure the deployment directory exists
        fs.ensureDirSync(deployPath);

        // Copy build files to deployment path
        fs.emptyDirSync(deployPath);
        fs.copySync(buildPath, deployPath);
        
        console.log(`Successfully deployed build files to ${deployPath}`);
    } catch (error) {
        console.error('Error during deployment:', error);
        process.exit(1);
    }
}

deploy();
