import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';
import { themes } from './src/lib/stores/settings';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {},
	plugins: [daisyui],
	daisyui: {
		themes,
		darkTheme: 'dark',
		base: true,
		styled: true,
		utils: true,
		prefix: '',
		logs: true,
		themeRoot: ':root'
	}
} satisfies Config;
