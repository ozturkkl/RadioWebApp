export async function scrollIntoViewPromise(element: Element, options: ScrollIntoViewOptions) {
	const THRESHOLD = 50;
	// First wait for any existing animations to complete
	let hasAnimations = element.getAnimations().length > 0;
	while (hasAnimations) {
		await new Promise((resolve) => setTimeout(resolve, THRESHOLD));
		hasAnimations = element.getAnimations().length > 0;
	}

	// Then handle the scroll
	return new Promise<void>((resolve) => {
		let scrollTimeout: NodeJS.Timeout;
		const scrollHandler = () => {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				requestAnimationFrame(() => {
					removeEventListener('scroll', scrollHandler, true);
					resolve();
				});
			}, THRESHOLD);
		};

		addEventListener('scroll', scrollHandler, true);
		element.scrollIntoView(options);
		setTimeout(() => {
			requestAnimationFrame(scrollHandler);
		}, 0);
	});
}
