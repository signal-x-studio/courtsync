// Reference: https://svelte.dev/docs/kit/routing#server
// Purpose: Server-side API route to proxy AES court schedule requests
// Note: Accepts date and timeWindow as query parameters

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const AES_BASE_URL = 'https://results.advancedeventsystems.com/odata';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
	const { eventId } = params;
	const date = url.searchParams.get('date');
	const timeWindow = url.searchParams.get('timeWindow') || '1440';

	if (!date) {
		return json({ error: 'Date parameter is required' }, { status: 400 });
	}

	try {
		const aesUrl = `${AES_BASE_URL}/${eventId}/courtschedule(date='${date}',tWindow=${timeWindow})`;
		const response = await fetch(aesUrl);

		if (!response.ok) {
			return json(
				{ error: `AES API returned ${response.status}` },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Error fetching court schedule:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
