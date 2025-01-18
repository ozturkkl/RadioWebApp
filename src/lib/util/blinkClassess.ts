export function blinkClasses(
	element: HTMLElement,
	classes: string[],
	count: number = 1,
	delay: number = 0,
	on = 250,
	off = 50
): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(async () => {
			for (let i = 0; i < count; i++) {
				classes.forEach((className) => element.classList.add(className));
				await new Promise((resolve) => setTimeout(resolve, on));
				classes.forEach((className) => element.classList.remove(className));
				await new Promise((resolve) => setTimeout(resolve, off));
			}
			resolve();
		}, delay);
	});
}
