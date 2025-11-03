// Reference: https://svelte.dev/docs/kit/routing#server
// Purpose: Server-side API route to proxy AES team assignments requests
// Note: Accepts clubId as query parameter (defaults to 0 for all teams)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const AES_BASE_URL = 'https://results.advancedeventsystems.com/odata';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
	const { eventId } = params;
	const clubId = url.searchParams.get('clubId') || '0';

	try {
		const aesUrl = `${AES_BASE_URL}/${eventId}/nextassignments(dId=null,cId=${clubId},tIds=[])`;
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
		console.error('Error fetching team assignments:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
