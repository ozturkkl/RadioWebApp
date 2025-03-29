import 'dotenv/config';
import fs from 'fs-extra';

async function deploy() {
    try {
        const buildPath = 'build';
        const deployPath = process.env.DEPLOY_BUILD_PATH;

        if (!deployPath) {
            throw new Error('DEPLOY_BUILD_PATH environment variable is not set');
        }

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
