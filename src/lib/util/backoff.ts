/**
 * Executes a function with exponential backoff retry strategy
 * @param fn The async function to execute with backoff
 * @param maxRetries Maximum number of retries (default: 5)
 * @param initialDelay Initial delay in milliseconds (default: 1000)
 * @param backoffFactor Factor by which the delay increases with each retry (default: 2)
 * @returns Promise resolving to the result of the function
 */
export async function withBackoff<T>(
	fn: () => Promise<T>,
	backoffFactor = 2,
	initialDelay = 1000,
	maxRetries = Number.MAX_SAFE_INTEGER
): Promise<T> {
	let currentDelay = initialDelay;
	let retries = 0;

	while (true) {
		try {
			return await fn();
		} catch (error) {
			retries++;
			if (retries > maxRetries) {
				throw error;
			}

			console.log(`Retrying in ${currentDelay / 1000} seconds`);
			await new Promise((resolve) => setTimeout(resolve, currentDelay));

			// Increase delay exponentially for next retry
			currentDelay = currentDelay * backoffFactor;
		}
	}
}
