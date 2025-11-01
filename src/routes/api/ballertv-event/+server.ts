import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Server-side proxy for BallerTV event page to bypass CORS restrictions
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const eventUrl = url.searchParams.get('url');
    
    if (!eventUrl) {
      return json({ error: 'Missing event URL parameter' }, { status: 400 });
    }
    
    // Decode and validate URL
    let decodedUrl: string;
    try {
      decodedUrl = decodeURIComponent(eventUrl);
      new URL(decodedUrl); // Validate URL format
    } catch {
      return json({ error: 'Invalid URL format' }, { status: 400 });
    }
    
    // Only allow BallerTV URLs
    if (!decodedUrl.includes('ballertv.com')) {
      return json({ error: 'Only BallerTV URLs are allowed' }, { status: 400 });
    }
    
    console.log(`[Server] Fetching BallerTV event page: ${decodedUrl}`);
    
    const response = await fetch(decodedUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      console.error(`[Server] BallerTV event page fetch failed: ${response.status} ${response.statusText}`);
      return json(
        { error: `Failed to fetch event page: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    console.log(`[Server] Successfully fetched BallerTV event page (${html.length} chars)`);
    
    return json({ html });
  } catch (error) {
    console.error('[Server] Error fetching BallerTV event page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event page';
    return json(
      { error: errorMessage },
      { status: 500 }
    );
  }
};

