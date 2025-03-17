/**
 * Detects if the current device is running iOS
 * @returns boolean indicating if the device is iOS
 */
export function isIOS(): boolean {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') {
		return false;
	}

	return (
		// Standard iOS detection
		['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
			navigator.platform
		) ||
		// iPad on iOS 13+ detection (iPads no longer report as iPad in platform)
		(navigator.userAgent.includes('Mac') && 'ontouchend' in document) ||
		// Additional check for iOS devices
		(/iPad|iPhone|iPod/.test(navigator.userAgent) &&
			!(window as unknown as { MSStream: unknown }).MSStream)
	);
}

export type BrowserType = 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'Unknown';

/**
 * Detects the current browser
 * @returns The detected browser as a string literal type
 */
export function detectBrowser(): BrowserType {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') {
		return 'Unknown';
	}

	const userAgent = navigator.userAgent.toLowerCase();

	// Chrome
	if (userAgent.includes('chrome') && !userAgent.includes('edg') && !userAgent.includes('opr')) {
		return 'Chrome';
	}

	// Firefox
	if (userAgent.includes('firefox')) {
		return 'Firefox';
	}

	// Safari
	if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
		return 'Safari';
	}

	// Edge
	if (userAgent.includes('edg')) {
		return 'Edge';
	}

	// Opera
	if (userAgent.includes('opr') || userAgent.includes('opera')) {
		return 'Opera';
	}

	// Default for unknown browsers
	return 'Unknown';
}

/**
 * Detects if the current device is a touch device
 * @returns boolean indicating if the device supports touch input
 */
export function isTouchDevice(): boolean {
	// Only run this check in the browser
	if (typeof window === 'undefined') return false;

	// Multiple checks for touch device detection
	return (
		'ontouchstart' in window ||
		navigator.maxTouchPoints > 0 ||
		window.matchMedia('(hover: none) and (pointer: coarse)').matches
	);
}
