import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_BASE_URL = 'https://results.advancedeventsystems.com/api';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { eventId, playId } = params;

    if (!eventId || !playId) {
      return json({ error: 'Missing eventId or playId' }, { status: 400 });
    }

    // URL encode the eventId in case it contains special characters
    // Note: playId can be negative (e.g., -54617), keep it as-is in the URL
    const encodedEventId = encodeURIComponent(eventId);
    const url = `${API_BASE_URL}/event/${encodedEventId}/poolsheet/${playId}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error(`[Server] Poolsheet API error: ${response.status} - ${errorText.substring(0, 200)}`);
      return json(
        { error: `Failed to fetch pool sheet: ${response.statusText}`, matches: [] },
        { status: response.status }
      );
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      // If it's HTML, it's likely an error page
      if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
        // Silently return 404 for missing poolsheets (very common, no need to log)
        return json(
          { error: 'Poolsheet not available', matches: [] },
          { status: 404 }
        );
      }
      // Try to parse as JSON anyway
      try {
        const data = JSON.parse(text);
        return json(data);
      } catch {
        return json(
          { error: 'Invalid response format', matches: [] },
          { status: 500 }
        );
      }
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error('[Server] Error fetching poolsheet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pool sheet';
    return json(
      { error: errorMessage, matches: [] },
      { status: 500 }
    );
  }
};

