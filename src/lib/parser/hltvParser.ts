/**
 * HLTV Parser Integration
 * Wraps the JavaScript parsers from the C# application
 */

export interface MatchData {
  dateText: string | null;
  eventName: string | null;
  isLive: boolean;
  type: string | null;
  team1: string | null;
  team2: string | null;
  url: string | null;
  unixTime: number | null;
  odds1: number | null;
  odds2: number | null;
}

export interface MapDetails {
  MapName: string;
  Link: string;
  GameNumber: number;
  Player1Name: string;
  Player1Score: number;
  Player1Lost: boolean;
  Player1Won: boolean;
  Player1Pick: boolean;
  Player1Score1: number;
  Player1Side1: string;
  Player1Score2: number;
  Player1Side2: string;
  Player1Score3: number;
  Player1Side3: string;
  Player2Name: string;
  Player2Score: number;
  Player2Lost: boolean;
  Player2Won: boolean;
  Player2Pick: boolean;
  Player2Score1: number;
  Player2Side1: string;
  Player2Score2: number;
  Player2Side2: string;
  Player2Score3: number;
  Player2Side3: string;
}

export interface TeamBasic {
  Position: number;
  Name: string;
  Points: number;
  HltvId: number | null;
  DatePlayersParsed: string | null;
  DateGamesParsed: string | null;
  Comment: string | null;
}

export interface TeamPlayer {
  id: number;
  teamName: string;
  name: string;
  strTimeInTeam: string;
  daysInTeam: number;
  mapsCount: number;
  rating: number;
}

export interface TeamCoach {
  id: number;
  teamName: string;
  name: string;
  strTimeInTeam: string;
  daysInTeam: number;
  mapsCount: number;
  trophies: number;
  winrate: number;
}

export interface TeamPlayersData {
  coach: TeamCoach | null;
  players: TeamPlayer[];
}

export interface TeamMapStats {
  MapName: string;
  WinsCount: number;
  DrawsCount: number;
  LossesCount: number;
  WinRatePercent: number;
  TotalRounds: number;
  PickPercent: number;
  BanPercent: number;
}

/**
 * Load and execute a parser script in a given HTML context
 */
async function executeParser<T>(
  html: string,
  parserScript: string
): Promise<T> {
  // Create a temporary DOM environment
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Create a sandboxed function that has access to the document
  const func = new Function('document', `
    ${parserScript}
  `);
  
  try {
    const result = func(doc);
    return result as T;
  } catch (error) {
    console.error('Parser execution error:', error);
    throw error;
  }
}

/**
 * Parse matches from HLTV matches page
 */
export async function parseMatches(html: string): Promise<MatchData[]> {
  const parserScript = await fetch('/src/lib/parser/MatchesParser.js').then(r => r.text());
  return executeParser<MatchData[]>(html, parserScript);
}

/**
 * Parse game details (map results) from HLTV match page
 */
export async function parseGameDetails(html: string): Promise<MapDetails[]> {
  const parserScript = await fetch('/src/lib/parser/GameDetailsParser.js').then(r => r.text());
  return executeParser<MapDetails[]>(html, parserScript);
}

/**
 * Parse team rankings from HLTV ranking page
 */
export async function parseTeamBasic(html: string): Promise<TeamBasic[]> {
  const parserScript = await fetch('/src/lib/parser/TeamBasicParser.js').then(r => r.text());
  return executeParser<TeamBasic[]>(html, parserScript);
}

/**
 * Parse team players and coach from HLTV team page
 */
export async function parseTeamPlayers(html: string): Promise<TeamPlayersData> {
  const parserScript = await fetch('/src/lib/parser/TeamPlayersParser.js').then(r => r.text());
  return executeParser<TeamPlayersData>(html, parserScript);
}

/**
 * Parse team map statistics from HLTV team page
 */
export async function parseTeamMaps(html: string): Promise<TeamMapStats[]> {
  const parserScript = await fetch('/src/lib/parser/TeamMapsParser.js').then(r => r.text());
  return executeParser<TeamMapStats[]>(html, parserScript);
}

/**
 * Fetch and parse HLTV matches using Supabase Edge Function
 */
export async function fetchAndParseMatches(useSupabase: boolean = true): Promise<MatchData[]> {
  try {
    if (useSupabase) {
      // Use Supabase Edge Function (more reliable)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not found, falling back to CORS proxy');
        return fetchWithCorsProxy();
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/parse-hltv-matches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Edge function returned status ${response.status}`);
      }
      
      const data = await response.json();
      return data.matches || [];
    } else {
      // Fallback to CORS proxy
      return fetchWithCorsProxy();
    }
  } catch (error) {
    console.error('Failed to fetch HLTV matches:', error);
    throw error;
  }
}

/**
 * Fallback: Fetch using CORS proxy
 */
async function fetchWithCorsProxy(): Promise<MatchData[]> {
  const corsProxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
  ];
  
  const hltvUrl = 'https://www.hltv.org/matches';
  
  for (const proxy of corsProxies) {
    try {
      const url = `${proxy}${encodeURIComponent(hltvUrl)}`;
      const response = await fetch(url);
      const html = await response.text();
      return parseMatches(html);
    } catch (error) {
      console.warn(`CORS proxy ${proxy} failed:`, error);
      continue;
    }
  }
  
  throw new Error('All CORS proxies failed');
}

/**
 * Convert MatchData to the format used in the Matches page
 */
export function convertToMatchFormat(match: MatchData) {
  const date = match.unixTime 
    ? new Date(match.unixTime * 1000).toISOString().split('T')[0]
    : match.dateText || new Date().toISOString().split('T')[0];

  return {
    id: `${match.team1}-${match.team2}-${match.unixTime || Date.now()}`,
    date,
    team1: match.team1 || 'Unknown',
    team2: match.team2 || 'Unknown',
    tournament: match.eventName || 'Unknown Tournament',
    favorite: match.odds1 && match.odds2 ? (match.odds1 < match.odds2 ? match.team1 : match.team2) : match.team1,
    risk: match.odds1 && match.odds2 
      ? Math.abs(match.odds1 - match.odds2) < 0.3 ? 'High' : 'Medium'
      : 'Medium',
    comment: match.type || '',
    aiSummary: `${match.team1} vs ${match.team2} - ${match.eventName}`,
    odds: match.odds1 || 1.5,
    winRate: 50,
    formStability: 'Stable' as const,
    context: {
      tier: 'A',
      isHotMatch: match.isLive || false
    },
    url: match.url ? `https://www.hltv.org${match.url}` : undefined
  };
}