import type { SetScore, MatchScore } from '$lib/types';

/**
 * Parse BallerTV stream page HTML to extract live match scores
 * 
 * Note: This function will need to be adapted based on actual BallerTV page structure.
 * BallerTV may use JavaScript-rendered content, so we may need to:
 * 1. Use a headless browser approach (Puppeteer/Playwright)
 * 2. Find API endpoints they use
 * 3. Parse embedded JSON data in the HTML
 */
export async function fetchBallerTVScore(
  matchId: number,
  ballerTVLink: string
): Promise<{
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
} | null> {
  try {
    console.log(`📡 BallerTV: Fetching HTML for match ${matchId}`);
    console.log(`   Request URL: ${ballerTVLink}`);
    
    // Fetch the BallerTV page
    // Note: This may fail due to CORS restrictions
    const response = await fetch(ballerTVLink, {
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      console.warn(`❌ BallerTV fetch failed for match ${matchId}: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    console.log(`📄 BallerTV: Received HTML response for match ${matchId} (${html.length} chars)`);
    
    // Log first 500 chars of HTML for debugging
    const preview = html.substring(0, 500);
    console.log(`   HTML preview: ${preview}${html.length > 500 ? '...' : ''}`);
    
    // Parse HTML to extract score data
    // This is a placeholder - actual implementation depends on BallerTV's HTML structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to find score elements in the DOM
    // Common patterns we might look for:
    // 1. Data attributes with score info
    // 2. Structured JSON in script tags
    // 3. Score display elements with specific classes
    
    // Look for JSON data in script tags (common pattern)
    // Try multiple patterns: application/json, application/ld+json, and untyped script tags
    const scriptTags = doc.querySelectorAll('script[type="application/json"], script[type="application/ld+json"], script:not([type]), script[type="text/javascript"]');
    console.log(`🔍 BallerTV: Found ${scriptTags.length} script tag(s) total`);
    
    // Look for common patterns: window.__INITIAL_STATE__, __NEXT_DATA__, etc.
    const htmlText = html.toLowerCase();
    const hasInitialState = htmlText.includes('__initial_state__') || htmlText.includes('__next_data__') || htmlText.includes('window.__data');
    if (hasInitialState) {
      console.log(`🔍 BallerTV: Found potential state object in HTML`);
    }
    
    // Try to find score-related text patterns in the HTML
    const scorePatterns = [
      /score[:\s]*(\d+)[\s-]*(\d+)/gi,
      /(\d+)[\s-]*(\d+)[\s]*score/gi,
      /set\s*(\d+)[:\s]*(\d+)[\s-]*(\d+)/gi,
    ];
    
    let foundScoreText = false;
    scorePatterns.forEach((pattern, idx) => {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`🔍 BallerTV: Found ${matches.length} potential score pattern(s) in HTML (pattern ${idx + 1}):`, matches.slice(0, 5));
        foundScoreText = true;
      }
    });
    
    for (const script of Array.from(scriptTags)) {
      try {
        const scriptText = script.textContent || '';
        if (!scriptText.trim()) continue;
        
        // Check if script contains score-related data
        const lowerScript = scriptText.toLowerCase();
        if (lowerScript.includes('score') || lowerScript.includes('match') || lowerScript.includes('set')) {
          console.log(`🔍 BallerTV: Found script tag with score-related content (${scriptText.length} chars)`);
          
          // Try to parse as JSON
          try {
            const data = JSON.parse(scriptText);
            console.log(`   Parsing JSON script tag:`, Object.keys(data).slice(0, 10));
            const scoreData = parseScoreFromJSON(data);
            if (scoreData) {
              console.log(`✅ BallerTV: Found score data in JSON script tag`);
              return scoreData;
            }
          } catch (e) {
            // Not JSON, try to find JSON objects within the script
            const jsonMatches = scriptText.match(/\{[\s\S]{20,}\}/g);
            if (jsonMatches) {
              console.log(`   Found ${jsonMatches.length} potential JSON object(s) in script`);
              for (const jsonStr of jsonMatches.slice(0, 3)) {
                try {
                  const data = JSON.parse(jsonStr);
                  const scoreData = parseScoreFromJSON(data);
                  if (scoreData) {
                    console.log(`✅ BallerTV: Found score data in embedded JSON`);
                    return scoreData;
                  }
                } catch {}
              }
            }
          }
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    // Look for score display elements - more specific selectors
    const scoreSelectors = [
      '[data-score]',
      '[class*="score"]',
      '[id*="score"]',
      '[class*="Score"]',
      '[id*="Score"]',
      '[data-team-score]',
      '[data-set-score]',
      '[class*="set-score"]',
      '[class*="match-score"]',
      '[class*="live-score"]',
      '[class*="current-score"]',
    ];
    
    let allScoreElements: Element[] = [];
    scoreSelectors.forEach(selector => {
      try {
        const elements = doc.querySelectorAll(selector);
        allScoreElements.push(...Array.from(elements));
      } catch {}
    });
    
    // Remove duplicates
    const uniqueScoreElements = Array.from(new Set(allScoreElements));
    console.log(`🔍 BallerTV: Found ${uniqueScoreElements.length} potential score element(s) using ${scoreSelectors.length} selector(s)`);
    
    if (uniqueScoreElements.length > 0) {
      // Log first few score elements for debugging
      uniqueScoreElements.slice(0, 10).forEach((el, idx) => {
        const text = el.textContent?.trim() || '';
        const innerHTML = el.innerHTML?.substring(0, 100) || '';
        console.log(`   Score element ${idx + 1}:`, {
          tag: el.tagName,
          classes: el.className,
          id: el.id,
          text: text.substring(0, 100),
          innerHTML: innerHTML,
          dataAttrs: Array.from(el.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .map(attr => `${attr.name}=${attr.value}`)
        });
      });
      
      const scoreData = parseScoreFromDOM(uniqueScoreElements as any);
      if (scoreData) {
        console.log(`✅ BallerTV: Found score data in DOM elements`);
        return scoreData;
      }
    }
    
    // If we can't parse, return null
    console.warn(`⚠️ BallerTV: Could not parse score data for match ${matchId}`);
    console.log(`   Debug info: Title="${doc.title}", Body length=${doc.body?.textContent?.length || 0}`);
    
    // Log a sample of the body HTML to help identify structure
    const bodySample = doc.body?.innerHTML?.substring(0, 1000) || '';
    if (bodySample) {
      console.log(`   Body HTML sample:`, bodySample);
    }
    
    // Check if page appears to be a React/SPA app
    const hasReactRoot = doc.querySelector('[id="root"], [id="app"], [id="__next"]') !== null;
    const hasReactData = html.includes('react') || html.includes('React') || html.includes('__NEXT_DATA__');
    if (hasReactRoot || hasReactData) {
      console.log(`   ⚠️ Page appears to be a JavaScript-rendered SPA - scores may be dynamically loaded`);
      console.log(`   💡 Suggestion: May need to use a headless browser (Puppeteer/Playwright) or find API endpoint`);
    }
    
    return null;
    
  } catch (error) {
    // Handle CORS errors or network failures
    if (error instanceof TypeError && error.message.includes('CORS')) {
      console.warn(`CORS error fetching BallerTV data for match ${matchId}. May need proxy.`);
    } else {
      console.error(`Error fetching BallerTV score for match ${matchId}:`, error);
    }
    return null;
  }
}

/**
 * Parse score data from JSON structure (if BallerTV embeds JSON)
 */
function parseScoreFromJSON(data: any): {
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
} | null {
  console.log(`🔍 BallerTV: Attempting to parse score from JSON structure:`, JSON.stringify(data).substring(0, 200));
  
  // This is a placeholder - actual implementation depends on BallerTV's JSON structure
  // We'll need to inspect actual responses to implement this properly
  
  // Example structure we might find:
  // {
  //   match: {
  //     sets: [{ team1Score: 25, team2Score: 20, setNumber: 1, completed: true }, ...],
  //     status: 'live'
  //   }
  // }
  
  // Try to find common patterns
  // Look for nested match/sets data
  const matchData = data.match || data.game || data.event || data;
  
  if (matchData && matchData.sets && Array.isArray(matchData.sets)) {
    console.log(`✅ BallerTV: Found sets array in JSON with ${matchData.sets.length} sets`);
    // Parse sets
    return null; // Will implement based on actual structure
  }
  
  return null;
}

/**
 * Parse score data from DOM elements
 */
function parseScoreFromDOM(elements: NodeListOf<Element>): {
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
} | null {
  console.log(`🔍 BallerTV: Attempting to parse score from ${elements.length} DOM element(s)`);
  
  // This is a placeholder - actual implementation depends on BallerTV's DOM structure
  
  // Try to extract:
  // - Set scores (e.g., "25-20", "23-25")
  // - Current set being played
  // - Match status
  
  // Log all element details for debugging
  Array.from(elements).forEach((el, idx) => {
    console.log(`   Element ${idx + 1}:`, {
      tag: el.tagName,
      classes: el.className,
      id: el.id,
      text: el.textContent?.trim(),
      innerHTML: el.innerHTML?.substring(0, 100),
      dataAttrs: Array.from(el.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {})
    });
  });
  
  return null;
}

/**
 * Alternative: Try to fetch score data from BallerTV API endpoint
 * This would be preferred if BallerTV exposes an API
 */
export async function fetchBallerTVScoreFromAPI(
  matchId: number,
  ballerTVLink: string
): Promise<{
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
} | null> {
  try {
    // Extract event ID and court ID from BallerTV link
    // Example: https://www.ballertv.com/streams?aes_event_id=41314&aes_court_id=-53163
    const url = new URL(ballerTVLink);
    const eventId = url.searchParams.get('aes_event_id');
    const courtId = url.searchParams.get('aes_court_id');
    
    if (!eventId || !courtId) {
      console.warn(`⚠️ BallerTV: Invalid link format for match ${matchId}: ${ballerTVLink}`);
      return null;
    }
    
    // Try to construct API endpoint (may not exist)
    // This is speculative - we'd need to discover the actual API
    const apiUrl = `https://www.ballertv.com/api/events/${eventId}/courts/${courtId}/scores`;
    console.log(`🌐 BallerTV: Attempting API fetch for match ${matchId}`);
    console.log(`   API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      console.log(`   API not available: ${response.status} ${response.statusText}`);
      return null; // API endpoint doesn't exist or requires auth
    }
    
    const data = await response.json();
    console.log(`   API response:`, JSON.stringify(data).substring(0, 200));
    return parseScoreFromJSON(data);
    
  } catch (error) {
    // API endpoint likely doesn't exist
    return null;
  }
}

/**
 * Main function to fetch BallerTV score - tries API first, then HTML parsing
 */
export async function getBallerTVScore(
  matchId: number,
  ballerTVLink: string
): Promise<{
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
} | null> {
  // Try API first (preferred method)
  const apiScore = await fetchBallerTVScoreFromAPI(matchId, ballerTVLink);
  if (apiScore) {
    return apiScore;
  }
  
  // Fall back to HTML parsing
  return await fetchBallerTVScore(matchId, ballerTVLink);
}

/**
 * Convert BallerTV score data to our SetScore format
 */
export function convertBallerTVSetsToSetScores(
  ballerTVSets: Array<{
    FirstTeamScore: number | null;
    SecondTeamScore: number | null;
    setNumber?: number;
    completed?: boolean;
  }>,
  currentSetIndex?: number
): SetScore[] {
  const sets: SetScore[] = [];
  
  ballerTVSets.forEach((set, index) => {
    const setNumber = set.setNumber || index + 1;
    const team1Score = set.FirstTeamScore ?? 0;
    const team2Score = set.SecondTeamScore ?? 0;
    
    // Determine if set is completed
    // If both scores are non-null and equal to 25 (or one team has 25+), set is likely completed
    const isCompleted = set.completed !== undefined 
      ? set.completed 
      : (team1Score !== null && team2Score !== null && (team1Score >= 25 || team2Score >= 25));
    
    sets.push({
      setNumber,
      team1Score,
      team2Score,
      completedAt: isCompleted ? Date.now() : 0 // 0 means in-progress
    });
  });
  
  return sets;
}

/**
 * Determine match status from BallerTV data
 */
export function determineMatchStatus(
  sets: SetScore[],
  scheduledStart: number,
  scheduledEnd: number
): 'not-started' | 'in-progress' | 'completed' {
  const now = Date.now();
  
  // If match hasn't started yet
  if (now < scheduledStart) {
    return 'not-started';
  }
  
  // Check if all sets are completed
  const allSetsCompleted = sets.length > 0 && sets.every(set => set.completedAt > 0);
  
  // If match time window has passed and sets are completed
  if (now > scheduledEnd && allSetsCompleted) {
    return 'completed';
  }
  
  // If any set is in progress (not completed)
  const hasInProgressSet = sets.some(set => set.completedAt === 0);
  if (hasInProgressSet) {
    return 'in-progress';
  }
  
  // If we're in the match time window but no sets started, assume not-started
  if (now >= scheduledStart && now <= scheduledEnd && sets.length === 0) {
    return 'not-started';
  }
  
  // Default to in-progress if we're in the time window
  if (now >= scheduledStart && now <= scheduledEnd) {
    return 'in-progress';
  }
  
  return 'completed';
}

