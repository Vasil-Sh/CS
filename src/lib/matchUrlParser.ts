/**
 * Match URL parsers — extract team names from HLTV / Dota2 URLs.
 * Extracted from CS2BettingForm.tsx. Pure functions, zero component deps.
 */

export interface ParsedMatchResult {
  team1: string;
  team2: string;
  tournament: string;
}

const TOURNAMENT_KEYWORDS = [
  'esl', 'pro', 'league', 'season',
  'blast', 'premier', 'spring', 'fall', 'groups', 'finals',
  'iem', 'katowice', 'cologne', 'sydney', 'beijing',
  'major', 'championship', 'pgl', 'antwerp', 'stockholm',
  'faceit', 'london', 'eleague', 'dreamhack', 'masters',
  'nodwin', 'clutch', 'series',
  'digital', 'crusade', 'draculan',
];

/** Parse a Dota 2 match URL — extracts team1, team2, tournament */
export function parseDota2MatchFromUrl(url: string): ParsedMatchResult | null {
  try {
    const regex = /dota2\/[^/]+\/([a-z0-9\-_]+-vs-[a-z0-9\-_]+)\//i;
    const match = url.match(regex);
    if (!match?.[1]) return null;

    const parts = match[1].split('-');
    const vsIndex = parts.findIndex(part => part === 'vs');
    if (vsIndex <= 0 || vsIndex >= parts.length - 1) return null;

    const team1 = parts.slice(0, vsIndex).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    const team2 = parts.slice(vsIndex + 1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    return { team1, team2, tournament: 'Dota 2 Tournament' };
  } catch {
    return null;
  }
}

/** Parse a CS2 HLTV match URL — extracts team1, team2, tournament */
export function parseCS2MatchFromUrl(url: string): ParsedMatchResult | null {
  try {
    const urlParts = url.split('/');
    const matchInfo = urlParts[urlParts.length - 1];
    if (!matchInfo) return null;

    const parts = matchInfo.split('-');
    const vsIndex = parts.findIndex(part => part === 'vs');
    if (vsIndex <= 0 || vsIndex >= parts.length - 1) return null;

    const team1 = parts.slice(0, vsIndex).join(' ').toUpperCase();
    const afterVs = parts.slice(vsIndex + 1);

    let tournamentStartIndex = -1;
    for (let i = 0; i < afterVs.length; i++) {
      if (TOURNAMENT_KEYWORDS.some(kw => afterVs[i].toLowerCase().includes(kw))) {
        tournamentStartIndex = i;
        break;
      }
    }

    let team2: string;
    let tournament: string;

    if (tournamentStartIndex > 0) {
      team2 = afterVs.slice(0, tournamentStartIndex).join(' ').toUpperCase();
      tournament = afterVs.slice(tournamentStartIndex).join(' ').replace(/-/g, ' ').toUpperCase();
    } else if (tournamentStartIndex === 0) {
      team2 = afterVs.slice(0, 2).join(' ').toUpperCase();
      tournament = afterVs.slice(2).join(' ').replace(/-/g, ' ').toUpperCase();
    } else {
      const midPoint = Math.ceil(afterVs.length / 2);
      team2 = afterVs.slice(0, midPoint).join(' ').toUpperCase();
      tournament = afterVs.slice(midPoint).join(' ').replace(/-/g, ' ').toUpperCase();
    }

    team2 = team2.replace(/\s+/g, ' ').trim();
    tournament = tournament.replace(/\s+/g, ' ').trim()
      .replace(/ESL PRO LEAGUE/g, 'ESL Pro League')
      .replace(/BLAST PREMIER/g, 'BLAST Premier')
      .replace(/IEM /g, 'IEM ')
      .replace(/SEASON (\d+)/g, 'Season $1')
      .replace(/NODWIN CLUTCH SERIES/g, 'NODWIN Clutch Series');

    return { team1, team2, tournament: tournament || 'Unknown Tournament' };
  } catch {
    return null;
  }
}
