// Reference: https://svelte.dev/docs/kit/routing#server
// Purpose: Server-side API route to proxy AES court schedule requests
// Note: Accepts date and timeWindow as query parameters

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_BASE_URL = 'https://results.advancedeventsystems.com/api';

export const GET: RequestHandler = async ({ params, url }) => {
	const { eventId } = params;
	const date = url.searchParams.get('date');
	const timeWindow = url.searchParams.get('timeWindow') || '1440';

	if (!eventId) {
		return json({ error: 'Missing eventId' }, { status: 400 });
	}

	if (!date) {
		return json({ error: 'Date parameter is required' }, { status: 400 });
	}

	try {
		const encodedEventId = encodeURIComponent(eventId);
		const aesUrl = `${API_BASE_URL}/event/${encodedEventId}/courts/${date}/${timeWindow}`;

		const response = await fetch(aesUrl, {
			headers: {
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => response.statusText);
			console.error(`[Server] Court schedule API error: ${response.status} - ${errorText.substring(0, 200)}`);
			return json(
				{ error: `Failed to fetch court schedule: ${response.statusText}` },
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
					{ error: 'Schedule not found' },
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
		console.error('[Server] Error fetching court schedule:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to fetch court schedule';
		return json(
			{ error: errorMessage },
			{ status: 500 }
		);
	}
};
