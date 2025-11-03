// Reference: guides/UNIFIED_AES_API_GUIDE.md
// Purpose: Proxy endpoint for AES poolsheet API to handle CORS and 404s
// Note: Poolsheets may not exist yet for all plays - returns 404 with helpful message

import { json, type RequestHandler } from '@sveltejs/kit';

const API_BASE_URL = 'https://results.advancedeventsystems.com/api';

export const GET: RequestHandler = async ({ params }) => {
	const { eventId, playId } = params;

	if (!eventId || !playId) {
		return json({ error: 'Event ID and Play ID are required' }, { status: 400 });
	}

	const url = `${API_BASE_URL}/event/${eventId}/poolsheet/${playId}`;

	try {
		const response = await fetch(url);

		// Handle 404 - poolsheet doesn't exist yet
		if (response.status === 404) {
			return json({ error: 'Poolsheet not available' }, { status: 404 });
		}

		// Handle other HTTP errors
		if (!response.ok) {
			return json(
				{ error: `Failed to fetch poolsheet: ${response.statusText}` },
				{ status: response.status }
			);
		}

		// Get response text to check for HTML error pages
		const text = await response.text();

		// Check if response is HTML (error page) instead of JSON
		if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
			return json({ error: 'Poolsheet not found or invalid play ID' }, { status: 404 });
		}

		// Try to parse as JSON
		try {
			const data = JSON.parse(text);
			return json(data);
		} catch (err) {
			return json({ error: 'Invalid response from AES API' }, { status: 500 });
		}
	} catch (err) {
		console.error('Poolsheet API Error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to fetch poolsheet' },
			{ status: 500 }
		);
	}
};
