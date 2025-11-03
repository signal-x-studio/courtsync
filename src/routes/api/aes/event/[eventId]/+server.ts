// Reference: https://svelte.dev/docs/kit/routing#server
// Purpose: Server-side API route to proxy AES event info requests
// Note: Avoids CORS issues by making requests from server instead of client

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_BASE_URL = 'https://results.advancedeventsystems.com/api';

export const GET: RequestHandler = async ({ params }) => {
	const { eventId } = params;

	if (!eventId) {
		return json({ error: 'Missing eventId' }, { status: 400 });
	}

	try {
		const encodedEventId = encodeURIComponent(eventId);
		const url = `${API_BASE_URL}/event/${encodedEventId}`;

		const response = await fetch(url, {
			headers: {
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => response.statusText);
			console.error(`[Server] Event info API error: ${response.status} - ${errorText.substring(0, 200)}`);
			return json(
				{ error: `Failed to fetch event info: ${response.statusText}` },
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
					{ error: 'Event not found or invalid event ID' },
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
		console.error('[Server] Error fetching event info:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event info';
		return json(
			{ error: errorMessage },
			{ status: 500 }
		);
	}
};
