import 'dotenv/config';

export function getEnv(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === '') {
        throw new Error(`${name} is required`);
    }
    return value;
}


