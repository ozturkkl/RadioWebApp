import 'dotenv/config';
import fs from 'fs-extra';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function getEnv(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === '') {
        throw new Error(`${name} is required`);
    }
    return value;
}

function extractSha256FromKeystore(): string {
    const keystorePath = getEnv('KEYSTORE_PATH');
    const keystoreAlias = getEnv('KEYSTORE_ALIAS');
    const storePassword = getEnv('KEYSTORE_STORE_PASSWORD');
    const keyPassword = getEnv('KEYSTORE_KEY_PASSWORD');

    try {
        const output = execFileSync(
            'keytool',
            [
                '-list',
                '-v',
                '-keystore',
                keystorePath,
                '-alias',
                keystoreAlias,
                '-storepass',
                storePassword,
                '-keypass',
                keyPassword as string
            ],
            { encoding: 'utf8' }
        );

        const match = output.match(/SHA-?256:\s*([A-F0-9:]+)/i);
        if (!match) {
            throw new Error('Could not parse SHA-256 fingerprint from keytool output');
        }
        return match[1].toUpperCase();
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        throw new Error(
            'Failed to run keytool for keystore extraction. Ensure JDK is installed and KEYSTORE_* env vars are correct. ' +
                details
        );
    }
}

async function main() {
    const packageName = getEnv('ASSETLINKS_PACKAGE_NAME');

    const sha256 = extractSha256FromKeystore();
    const sha256List = [sha256.toUpperCase()];

    const data = [
        {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: {
                namespace: 'android_app',
                package_name: packageName,
                sha256_cert_fingerprints: sha256List
            }
        }
    ];

    const outputDir = path.join('static', '.well-known');
    const outputFile = path.join(outputDir, 'assetlinks.json');

    fs.ensureDirSync(outputDir);
    fs.writeJsonSync(outputFile, data, { spaces: 2 });

    console.log(`Wrote ${outputFile} with ${sha256List.length} fingerprint(s) for ${packageName}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});


