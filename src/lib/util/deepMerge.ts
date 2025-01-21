export function deepMerge(
	target: Record<string, unknown>,
	source: Record<string, unknown>
): Record<string, unknown> {
	const output = { ...target };

	for (const key in source) {
		if (source[key] instanceof Object && !Array.isArray(source[key])) {
			if (key in target && target[key] instanceof Object && !Array.isArray(target[key])) {
				output[key] = deepMerge(
					target[key] as Record<string, unknown>,
					source[key] as Record<string, unknown>
				);
			} else {
				output[key] = { ...source[key] };
			}
		} else {
			output[key] = source[key];
		}
	}

	return output;
}
