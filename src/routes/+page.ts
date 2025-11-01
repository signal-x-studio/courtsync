import type { Page } from '@sveltejs/kit';

export const ssr = false;

export const load = (async () => {
	return {};
}) satisfies Page.Load;

