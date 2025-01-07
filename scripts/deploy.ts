import fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// grab deploy path from .env
const deployPath = process.env.DEPLOY_PATH;

if (!deployPath) {
	throw new Error('DEPLOY_PATH environment variable is not defined in .env file');
}

console.log('Deploying to:', deployPath);

try {
	// remove the deploy path if it exists
	if (fs.existsSync(deployPath)) {
		fs.rmSync(deployPath, { recursive: true, force: true });
	}

	// copy the build folder to the deploy path
	fs.cpSync('build', deployPath, { recursive: true });

	console.log('Deployment completed successfully!');
} catch (error) {
	console.error('Deployment failed:', error);
	process.exit(1);
}
