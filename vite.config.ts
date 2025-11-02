// Reference: https://vitest.dev/config/
// Reference: https://tailwindcss.com/blog/tailwindcss-v4
// Purpose: Configure Vite with SvelteKit, Tailwind v4, and Vitest
// Note: Tailwind v4 uses Vite plugin for best performance
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
