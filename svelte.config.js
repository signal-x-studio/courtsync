// Reference: https://svelte.dev/docs/kit/adapter-vercel
// Purpose: Configure SvelteKit to deploy on Vercel with route splitting
// Note: runtime 'nodejs20.x' is stable; 'nodejs22.x' also available
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x',
			split: true
		})
	}
};

export default config;
