// Reference: https://svelte.dev/docs/kit/routing#server
// Purpose: Server-side API route to proxy AES event info requests
// Note: Avoids CORS issues by making requests from server instead of client

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const AES_BASE_URL = 'https://results.advancedeventsystems.com/odata';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const { eventId } = params;

	try {
		const url = `${AES_BASE_URL}/${eventId}/eventinfo()`;
		const response = await fetch(url);

		if (!response.ok) {
			return json(
				{ error: `AES API returned ${response.status}` },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Error fetching event info:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
