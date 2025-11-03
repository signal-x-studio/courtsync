// Reference: https://svelte.dev/docs/kit/routing#server
// Purpose: Server-side API route to proxy AES team assignments requests
// Note: Accepts clubId as query parameter (defaults to 0 for all teams)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ODATA_BASE_URL = 'https://results.advancedeventsystems.com/odata';

export const GET: RequestHandler = async ({ params, url }) => {
	const { eventId } = params;
	const clubId = url.searchParams.get('clubId') || '0';

	if (!eventId) {
		return json({ error: 'Missing eventId' }, { status: 400 });
	}

	try {
		const aesUrl = `${ODATA_BASE_URL}/${eventId}/nextassignments(dId=null,cId=${clubId},tIds=[])`;

		const response = await fetch(aesUrl, {
			headers: {
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => response.statusText);
			console.error(`[Server] Team assignments API error: ${response.status} - ${errorText.substring(0, 200)}`);
			return json(
				{ error: `Failed to fetch team assignments: ${response.statusText}` },
				{ status: response.status }
			);
		}

		// Check if response is actually JSON
		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			const text = await response.text();
			// If it's HTML, it's likely an error page
			if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
				return json(
					{ error: 'Team assignments not found' },
					{ status: 404 }
				);
			}
			// Try to parse as JSON anyway
			try {
				const data = JSON.parse(text);
				return json(data);
			} catch {
				return json(
					{ error: 'Invalid response format' },
					{ status: 500 }
				);
			}
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('[Server] Error fetching team assignments:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team assignments';
		return json(
			{ error: errorMessage },
			{ status: 500 }
		);
	}
};
