/**
 * Adds CORS proxy to URLs only in development mode
 */
export function withCorsProxy(url: string): string {
	const isDevelopment = import.meta.env.DEV;
	if (isDevelopment) {
		return `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
	}
	return url;
}
