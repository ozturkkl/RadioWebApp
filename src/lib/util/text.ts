export function clampText(input: string, maxChars: number): string {
	if (!input) return '';
	if (input.length <= maxChars) return input;
	return input.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
}
