export function isIOS() {
	return (
		['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
			navigator.platform
		) ||
		// iPad on iOS 13 detection
		(navigator.userAgent.includes('Mac') && 'ontouchend' in document) ||
		(typeof window !== 'undefined' &&
			/iPad|iPhone|iPod/.test(navigator.userAgent) &&
			!(window as unknown as { MSStream: unknown }).MSStream)
	);
}
