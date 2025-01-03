import * as Icons from 'lucide-svelte';
import type { Icon } from 'lucide-svelte';

type IconName = keyof typeof Icons;
export const getIconComponent = (name: IconName) => {
	return Icons[name] as unknown as typeof Icon;
};
