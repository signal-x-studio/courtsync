import type { FilteredMatch, SetScore } from '$lib/types';

/**
 * Build BallerTV event page URL with filters
 * Example: https://www.ballertv.com/events/chi-town-boys-challenge-2025?filters={"search":["630"]}
 */
export function buildBallerTVEventUrl(eventName: string, clubFilter: string = '630'): string {
  // Convert event name to URL slug format
  // "Chi-Town Boys Challenge (2025)" -> "chi-town-boys-challenge-2025"
  const slug = eventName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  const filters = encodeURIComponent(JSON.stringify({ search: [clubFilter] }));
  return `https://www.ballertv.com/events/${slug}?filters=${filters}`;
}

/**
 * Extract match data from BallerTV event page HTML
 */
export interface BallerTVEventMatch {
  matchId?: number; // AES match ID if we can find it
  team1Name: string;
  team2Name: string;
  courtName?: string;
  sets: SetScore[];
  status: 'not-started' | 'in-progress' | 'completed';
  scoreText?: string; // Current score display text
  actualStartTime?: number; // Actual start time from BallerTV (timestamp in ms)
  setsWon?: { team1: number; team2: number }; // Sets won by each team
}

/**
 * Parse BallerTV event page HTML to extract match scores
 */
export async function fetchBallerTVEventScores(
  eventUrl: string,
  matches: FilteredMatch[] // Our matches to map against
): Promise<Map<number, BallerTVEventMatch>> {
  const matchMap = new Map<number, BallerTVEventMatch>();
  
  try {
    console.log(`📡 BallerTV: Fetching event page (checking ${matches.length} match[es])`);
    
    // Use server-side proxy to bypass CORS
    const proxyUrl = `/api/ballertv-event?url=${encodeURIComponent(eventUrl)}`;
    
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.warn(`❌ BallerTV: Fetch failed (${response.status}): ${errorData.error}`);
      return matchMap;
    }

    const data = await response.json();
    const html = data.html;
    
    if (!html) {
      console.warn(`❌ BallerTV: No HTML content received`);
      return matchMap;
    }
    
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to find script tags with match data
    const scriptTags = doc.querySelectorAll('script');
    
    for (const script of Array.from(scriptTags)) {
      const scriptText = script.textContent || '';
      if (!scriptText.trim()) continue;
      
      // Look for JSON data containing match/score information
      const lowerScript = scriptText.toLowerCase();
      if (lowerScript.includes('match') || lowerScript.includes('score') || lowerScript.includes('team')) {
        // Try to extract JSON objects
        const jsonMatches = scriptText.match(/\{[\s\S]{100,}\}/g);
        if (jsonMatches) {
          for (const jsonStr of jsonMatches.slice(0, 10)) {
            try {
              const data = JSON.parse(jsonStr);
              const jsonMatchesFound = parseMatchesFromJSON(data, matches);
              if (jsonMatchesFound.size > 0) {
                console.log(`   ✓ Found ${jsonMatchesFound.size} match(es) from JSON`);
                jsonMatchesFound.forEach((match, matchId) => matchMap.set(matchId, match));
              }
            } catch {}
          }
        }
      }
    }
    
    // Try to parse match cards from DOM
    // Look for common card selectors used by BallerTV
    // Try multiple strategies to find match cards
    const selectors = [
      '[class*="match"]',
      '[class*="game"]',
      '[data-match]',
      '[data-game]',
      '[class*="card"]',
      'article[class*="game"]',
      'article[class*="match"]',
      'div[class*="Match"]',
      'div[class*="Game"]',
      'a[href*="/games/"]',
      'a[href*="/matches/"]',
      // More generic: any element containing "LIVE" or team names
      'div, article, section, a'
    ];
    
    let matchCards: Element[] = [];
    for (const selector of selectors) {
      try {
        const elements = doc.querySelectorAll(selector);
        // Filter to elements that likely contain match data
        const filtered = Array.from(elements).filter(el => {
          const text = el.textContent || '';
          const innerHTML = el.innerHTML || '';
          // Look for indicators of a match card: LIVE, team names, scores, vs
          return text.includes('LIVE') || 
                 text.includes('REPLAY') ||
                 text.includes('vs') ||
                 text.includes('630') ||
                 /\d+\s+[A-Za-z]/.test(text); // Pattern like "1 Team Name"
        });
        matchCards.push(...filtered);
      } catch (e) {
        // Invalid selector, continue
      }
    }
    
    // Remove duplicates
    matchCards = Array.from(new Set(matchCards));
    
    if (matchCards.length > 0) {
      const domMatches = parseMatchesFromDOM(matchCards as NodeListOf<Element>, matches);
      if (domMatches.size > 0) {
        console.log(`   ✓ Found ${domMatches.size} match(es) from DOM`);
        domMatches.forEach((match, matchId) => matchMap.set(matchId, match));
      } else {
        console.warn(`   ⚠️ Found ${matchCards.length} potential card(s) but couldn't match to our ${matches.length} expected match(es)`);
      }
    }
    
  } catch (error) {
    console.error(`Error fetching BallerTV event page:`, error);
  }
  
  return matchMap;
}

/**
 * Parse matches from JSON data structure
 */
function parseMatchesFromJSON(
  data: any,
  ourMatches: FilteredMatch[]
): Map<number, BallerTVEventMatch> {
  const matches = new Map<number, BallerTVEventMatch>();
  
  // Try various JSON structures
  // This will need to be adapted based on actual BallerTV JSON structure
  
  // Log the structure for debugging
  console.log(`   JSON structure keys:`, Object.keys(data).slice(0, 20));
  
  // Look for arrays of matches/games
  const matchArrays = [
    data.matches,
    data.games,
    data.events,
    data.data?.matches,
    data.data?.games,
    data.event?.matches,
    data.event?.games,
  ].filter(Boolean);
  
  matchArrays.forEach((arr: any[], idx) => {
    console.log(`   Found match array ${idx + 1} with ${arr.length} items`);
    
    arr.forEach((item: any) => {
      // Try to match this item to one of our matches
      const matchedMatch = findMatchingMatch(item, ourMatches);
      if (matchedMatch) {
        const matchData = extractMatchData(item);
        if (matchData) {
          matches.set(matchedMatch.MatchId, matchData);
        }
      }
    });
  });
  
  return matches;
}

/**
 * Parse matches from DOM elements
 * Improved matching logic to handle BallerTV card structure
 */
function parseMatchesFromDOM(
  elements: NodeListOf<Element>,
  ourMatches: FilteredMatch[]
): Map<number, BallerTVEventMatch> {
  const matches = new Map<number, BallerTVEventMatch>();
  
  // First, extract all team names from BallerTV cards using aria-label/title attributes
  const ballerTVTeamNames = new Set<string>();
  elements.forEach((element) => {
    // Look for <p> elements with aria-label or title attributes (BallerTV structure)
    const teamNameElements = element.querySelectorAll('p[aria-label], p[title]');
    teamNameElements.forEach((el) => {
      const teamName = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent;
      if (teamName && teamName.trim()) {
        ballerTVTeamNames.add(teamName.trim());
      }
    });
    
    // Fallback: also check text content for team name patterns
    const text = element.textContent || '';
    const teamPatterns = [
      /\d+\s+([A-Za-z0-9\s-]+?)(?:\s+vs|\s+\d+|$)/g, // Format: "1 Team Name" or "0 Team Name"
      /([A-Za-z0-9\s-]+?)\s+vs\s+([A-Za-z0-9\s-]+?)(?:\s+\d+|\s+Nov|$)/g, // Format: "Team1 vs Team2"
    ];
    
    teamPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) ballerTVTeamNames.add(match[1].trim());
        if (match[2]) ballerTVTeamNames.add(match[2].trim());
      }
    });
  });
  
  // Extract team names silently (for internal matching only)
  
  // Now try to match each element to our matches
  elements.forEach((element) => {
    const text = element.textContent || '';
    const innerHTML = element.innerHTML || '';
    
    // Extract team names from aria-label/title attributes (more reliable)
    const teamNameElements = element.querySelectorAll('p[aria-label], p[title]');
    const extractedTeamNames: string[] = [];
    teamNameElements.forEach((el) => {
      const teamName = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent;
      if (teamName && teamName.trim()) {
        extractedTeamNames.push(teamName.trim());
      }
    });
    
    // Try to match against our matches with improved logic
    ourMatches.forEach(match => {
      // Normalize team names for comparison
      const normalizeTeamName = (name: string): string => {
        return name
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      const matchTeam1 = normalizeTeamName(match.FirstTeamText);
      const matchTeam2 = normalizeTeamName(match.SecondTeamText);
      const normalizedText = normalizeTeamName(text);
      
      // Check if both team names appear in the extracted team names (from aria-label/title)
      let team1Match = false;
      let team2Match = false;
      
      extractedTeamNames.forEach(extractedName => {
        const normalizedExtracted = normalizeTeamName(extractedName);
        if (normalizedExtracted.includes(matchTeam1) || matchTeam1.includes(normalizedExtracted) ||
            extractTeamIdentifier(matchTeam1) && normalizedExtracted.includes(extractTeamIdentifier(matchTeam1)!)) {
          team1Match = true;
        }
        if (normalizedExtracted.includes(matchTeam2) || matchTeam2.includes(normalizedExtracted) ||
            extractTeamIdentifier(matchTeam2) && normalizedExtracted.includes(extractTeamIdentifier(matchTeam2)!)) {
          team2Match = true;
        }
      });
      
      // Fallback: check text content if aria-label/title didn't match
      if (!team1Match || !team2Match) {
        const team1TextMatch = 
          normalizedText.includes(matchTeam1) ||
          matchTeam1.includes(normalizedText.split(' ')[0]) ||
          extractTeamIdentifier(matchTeam1) && normalizedText.includes(extractTeamIdentifier(matchTeam1)!);
        
        const team2TextMatch = 
          normalizedText.includes(matchTeam2) ||
          matchTeam2.includes(normalizedText.split(' ')[0]) ||
          extractTeamIdentifier(matchTeam2) && normalizedText.includes(extractTeamIdentifier(matchTeam2)!);
        
        if (!team1Match && team1TextMatch) team1Match = true;
        if (!team2Match && team2TextMatch) team2Match = true;
      }
      
      // Also check if BallerTV team names match
      ballerTVTeamNames.forEach(btvTeam => {
        const normalizedBTV = normalizeTeamName(btvTeam);
        if (!team1Match && (normalizedBTV.includes(matchTeam1) || matchTeam1.includes(normalizedBTV))) {
          team1Match = true;
        }
        if (!team2Match && (normalizedBTV.includes(matchTeam2) || matchTeam2.includes(normalizedBTV))) {
          team2Match = true;
        }
      });
      
      if (team1Match && team2Match) {
        // This element likely contains data for this match
        const matchData = extractMatchDataFromElement(element, match);
        if (matchData) {
          matches.set(match.MatchId, matchData);
        }
      }
    });
  });
  
  return matches;
}

/**
 * Extract team identifier from team name (e.g., "630 Volleyball 18-4" -> "18-4")
 */
function extractTeamIdentifier(teamName: string): string | null {
  // Look for pattern like "18-4", "16-2", etc.
  const match = teamName.match(/\d+-\d+/);
  return match ? match[0] : null;
}

/**
 * Find matching FilteredMatch from BallerTV data
 */
function findMatchingMatch(
  ballerTVData: any,
  ourMatches: FilteredMatch[]
): FilteredMatch | null {
  // Try to match by team names
  const team1Name = ballerTVData.team1Name || ballerTVData.firstTeamName || ballerTVData.team1?.name || '';
  const team2Name = ballerTVData.team2Name || ballerTVData.secondTeamName || ballerTVData.team2?.name || '';
  
  if (!team1Name || !team2Name) return null;
  
  return ourMatches.find(match => 
    (match.FirstTeamText.includes(team1Name) || team1Name.includes(match.FirstTeamText.split(' ')[0])) &&
    (match.SecondTeamText.includes(team2Name) || team2Name.includes(match.SecondTeamText.split(' ')[0]))
  ) || null;
}

/**
 * Extract match data from BallerTV JSON object
 */
function extractMatchData(data: any): BallerTVEventMatch | null {
  // This will need to be adapted based on actual BallerTV structure
  const team1Name = data.team1Name || data.firstTeamName || data.team1?.name || '';
  const team2Name = data.team2Name || data.secondTeamName || data.team2?.name || '';
  
  if (!team1Name || !team2Name) return null;
  
  // Try to extract sets/scores
  const sets: SetScore[] = [];
  const setsData = data.sets || data.scoreSets || [];
  
  setsData.forEach((set: any, index: number) => {
    sets.push({
      setNumber: index + 1,
      team1Score: set.team1Score || set.firstTeamScore || set.score1 || 0,
      team2Score: set.team2Score || set.secondTeamScore || set.score2 || 0,
      completedAt: set.completed ? Date.now() : 0
    });
  });
  
  // Determine status
  const status = data.status || (sets.length > 0 ? 'in-progress' : 'not-started');
  
  return {
    team1Name,
    team2Name,
    sets,
    status: status as 'not-started' | 'in-progress' | 'completed',
    scoreText: data.scoreText || data.score || ''
  };
}

/**
 * Extract match data from DOM element
 * Based on BallerTV card structure with LIVE tags, scores, and timestamps
 */
function extractMatchDataFromElement(
  element: Element,
  match: FilteredMatch
): BallerTVEventMatch | null {
  const text = element.textContent || '';
  const innerHTML = element.innerHTML || '';
  
  // Check if this is a LIVE match
  const isLive = text.includes('LIVE') || innerHTML.includes('LIVE') || 
                  element.querySelector('[class*="live"], [class*="LIVE"]');
  
  // Extract actual start time from timestamp
  // Format: "Nov 1st, 1:16 PM" or similar
  let actualStartTime: number | undefined;
  const timePatterns = [
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:st|nd|rd|th)?,\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        // Parse the date string
        const dateStr = match[0];
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          actualStartTime = parsed.getTime();
          break;
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }
  
  // Extract team names from aria-label/title attributes (more reliable)
  const teamNameElements = element.querySelectorAll('p[aria-label], p[title]');
  const extractedTeamNames: string[] = [];
  teamNameElements.forEach((el) => {
    const teamName = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent;
    if (teamName && teamName.trim()) {
      extractedTeamNames.push(teamName.trim());
    }
  });
  
  const team1Name = match.FirstTeamText;
  const team2Name = match.SecondTeamText;
  
  // Normalize team names for matching
  const normalizeTeamName = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
  };
  
  const normalizedText = normalizeTeamName(text);
  const normalizedTeam1 = normalizeTeamName(team1Name);
  const normalizedTeam2 = normalizeTeamName(team2Name);
  
  // Find team lines in the text with sets won
  // Look for patterns like "1 630 Volleyball 18-4" or "0 Team Name"
  let team1Match: RegExpMatchArray | null = null;
  let team2Match: RegExpMatchArray | null = null;
  
  // Try to find sets won pattern: "1 630 Volleyball 18-4" or "0 Team Name"
  const setsWonPattern = /(\d+)\s+([A-Za-z0-9\s-]+?)(?:\s+vs|\s+\d+|$)/g;
  const allMatches = Array.from(text.matchAll(setsWonPattern));
  
  for (const matchResult of allMatches) {
    const teamNameText = matchResult[2].trim();
    const normalizedMatchTeam = normalizeTeamName(teamNameText);
    
    // Check if this matches our team1 (check against extracted team names first)
    let matchesTeam1 = false;
    let matchesTeam2 = false;
    
    // Check against extracted team names from aria-label/title
    extractedTeamNames.forEach(extractedName => {
      const normalizedExtracted = normalizeTeamName(extractedName);
      if (normalizedExtracted === normalizedMatchTeam || 
          normalizedExtracted.includes(normalizedMatchTeam) || 
          normalizedMatchTeam.includes(normalizedExtracted)) {
        if (normalizedExtracted.includes(normalizedTeam1) || normalizedTeam1.includes(normalizedExtracted) ||
            extractTeamIdentifier(normalizedTeam1) && normalizedExtracted.includes(extractTeamIdentifier(normalizedTeam1)!)) {
          matchesTeam1 = true;
        }
        if (normalizedExtracted.includes(normalizedTeam2) || normalizedTeam2.includes(normalizedExtracted) ||
            extractTeamIdentifier(normalizedTeam2) && normalizedExtracted.includes(extractTeamIdentifier(normalizedTeam2)!)) {
          matchesTeam2 = true;
        }
      }
    });
    
    // Fallback: check text content
    if (!matchesTeam1 && (normalizedMatchTeam.includes(normalizedTeam1) || normalizedTeam1.includes(normalizedMatchTeam) ||
        extractTeamIdentifier(normalizedTeam1) && normalizedMatchTeam.includes(extractTeamIdentifier(normalizedTeam1)!))) {
      matchesTeam1 = true;
    }
    if (!matchesTeam2 && (normalizedMatchTeam.includes(normalizedTeam2) || normalizedTeam2.includes(normalizedMatchTeam) ||
        extractTeamIdentifier(normalizedTeam2) && normalizedMatchTeam.includes(extractTeamIdentifier(normalizedTeam2)!))) {
      matchesTeam2 = true;
    }
    
    if (matchesTeam1 && !team1Match) {
      team1Match = matchResult;
    }
    if (matchesTeam2 && !team2Match) {
      team2Match = matchResult;
    }
  }
  
  // If we didn't find sets won pattern, try to find teams by name alone
  if (!team1Match || !team2Match) {
    // Check if extracted team names match our teams
    let extractedTeam1Match = false;
    let extractedTeam2Match = false;
    
    extractedTeamNames.forEach(extractedName => {
      const normalizedExtracted = normalizeTeamName(extractedName);
      if (normalizedExtracted.includes(normalizedTeam1) || normalizedTeam1.includes(normalizedExtracted) ||
          extractTeamIdentifier(normalizedTeam1) && normalizedExtracted.includes(extractTeamIdentifier(normalizedTeam1)!)) {
        extractedTeam1Match = true;
      }
      if (normalizedExtracted.includes(normalizedTeam2) || normalizedTeam2.includes(normalizedExtracted) ||
          extractTeamIdentifier(normalizedTeam2) && normalizedExtracted.includes(extractTeamIdentifier(normalizedTeam2)!)) {
        extractedTeam2Match = true;
      }
    });
    
    // If we found both teams from extracted names, create dummy matches for sets won (will be 0-0)
    if (extractedTeam1Match && extractedTeam2Match && (!team1Match || !team2Match)) {
      // Look for sets won in a different format or assume 0-0 if not found
      const scorePattern = /(\d+)[\s-]+(\d+)/g;
      const scoreMatches = Array.from(text.matchAll(scorePattern));
      
      // Try to find sets won near team names
      for (const matchResult of allMatches) {
        const teamNameText = matchResult[2].trim();
        const normalizedMatchTeam = normalizeTeamName(teamNameText);
        
        if (!team1Match && (normalizedMatchTeam.includes(normalizedTeam1) || normalizedTeam1.includes(normalizedMatchTeam))) {
          team1Match = matchResult;
        }
        if (!team2Match && (normalizedMatchTeam.includes(normalizedTeam2) || normalizedTeam2.includes(normalizedMatchTeam))) {
          team2Match = matchResult;
        }
      }
    }
  }
  
  let setsWon: { team1: number; team2: number } | undefined;
  const sets: SetScore[] = [];
  
  if (team1Match && team2Match) {
    const team1SetsWon = parseInt(team1Match[1]);
    const team2SetsWon = parseInt(team2Match[1]);
    
    if (!isNaN(team1SetsWon) && !isNaN(team2SetsWon)) {
      setsWon = { team1: team1SetsWon, team2: team2SetsWon };
      
      // Extract current set score (format: "25-20" or similar)
      // Look for score patterns near the team names
      const scorePattern = /(\d+)[\s-]+(\d+)/g;
      const scoreMatches = Array.from(text.matchAll(scorePattern));
      
      // Find scores that are likely volleyball scores (15-30 range)
      for (const scoreMatch of scoreMatches) {
        const score1 = parseInt(scoreMatch[1]);
        const score2 = parseInt(scoreMatch[2]);
        
        if (score1 >= 15 && score1 <= 30 && score2 >= 15 && score2 <= 30) {
          // Determine which set this is based on sets won
          const setNumber = Math.max(team1SetsWon, team2SetsWon) + 1;
          sets.push({
            setNumber,
            team1Score: score1,
            team2Score: score2,
            completedAt: 0 // Current set in progress
          });
          
          // Also add completed sets
          for (let i = 1; i <= team1SetsWon; i++) {
            sets.push({
              setNumber: i,
              team1Score: 25, // Assume completed sets were won
              team2Score: 0,
              completedAt: Date.now() - (setNumber - i) * 60000 // Estimate completion time
            });
          }
          for (let i = 1; i <= team2SetsWon; i++) {
            const existingSet = sets.find(s => s.setNumber === i);
            if (existingSet) {
              existingSet.team2Score = 25;
              existingSet.team1Score = 0;
            } else {
              sets.push({
                setNumber: i,
                team1Score: 0,
                team2Score: 25,
                completedAt: Date.now() - (setNumber - i) * 60000
              });
            }
          }
          
          break;
        }
      }
    }
  } else if (isLive) {
    // If it's live but we couldn't parse sets won, at least mark it as in-progress
    // Try to extract any score patterns
    const scorePattern = /(\d+)[\s-]+(\d+)/g;
    const scoreMatches = Array.from(text.matchAll(scorePattern));
    
    for (const scoreMatch of scoreMatches) {
      const score1 = parseInt(scoreMatch[1]);
      const score2 = parseInt(scoreMatch[2]);
      
      if (score1 >= 15 && score1 <= 30 && score2 >= 15 && score2 <= 30) {
        sets.push({
          setNumber: sets.length + 1,
          team1Score: score1,
          team2Score: score2,
          completedAt: 0
        });
        break;
      }
    }
  }
  
  // Determine status
  let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';
  if (isLive) {
    status = 'in-progress';
  } else if (text.includes('REPLAY') || innerHTML.includes('REPLAY')) {
    status = 'completed';
  } else if (sets.length > 0) {
    status = 'in-progress';
  }
  
  // Return match data even if we only have status or actual start time
  // This allows us to detect matches even without full score data
  if (!isLive && sets.length === 0 && !actualStartTime) {
    // Only return null if we truly have no useful data
    // But if we matched teams, return at least basic info
    if (normalizedText.includes(normalizedTeam1) && normalizedText.includes(normalizedTeam2)) {
      // We found the teams but couldn't parse scores - still useful for matching
      return {
        team1Name: match.FirstTeamText,
        team2Name: match.SecondTeamText,
        sets: [],
        setsWon,
        status: isLive ? 'in-progress' : 'not-started',
        actualStartTime,
        scoreText: text.substring(0, 200)
      };
    }
    return null;
  }
  
  return {
    team1Name: match.FirstTeamText,
    team2Name: match.SecondTeamText,
    sets,
    setsWon,
    status,
    actualStartTime,
    scoreText: text.substring(0, 200)
  };
}

