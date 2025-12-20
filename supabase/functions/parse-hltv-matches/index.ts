import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔄 Fetching HLTV matches...');
    
    // Fetch HLTV matches page
    const hltvUrl = 'https://www.hltv.org/matches';
    const response = await fetch(hltvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      throw new Error(`HLTV returned status ${response.status}`);
    }

    const html = await response.text();
    console.log('✅ HLTV page fetched successfully');

    // Parse matches using the same logic as MatchesParser.js
    const matches = parseMatches(html);
    console.log(`📊 Parsed ${matches.length} matches`);

    return new Response(
      JSON.stringify({ matches }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

// Parser function (converted from MatchesParser.js)
function parseMatches(html: string) {
  const matches: any[] = [];
  
  try {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all match elements
    const matchElements = doc.querySelectorAll('.upcomingMatch, .liveMatch');
    
    matchElements.forEach((matchEl) => {
      try {
        const match: any = {};
        
        // Extract date/time
        const dateEl = matchEl.querySelector('.matchTime, .matchDate');
        match.dateText = dateEl?.textContent?.trim() || null;
        
        // Extract unix timestamp
        const timeAttr = matchEl.getAttribute('data-zonedgrouping-entry-unix');
        match.unixTime = timeAttr ? parseInt(timeAttr) : null;
        
        // Check if live
        match.isLive = matchEl.classList.contains('liveMatch');
        
        // Extract event name
        const eventEl = matchEl.querySelector('.matchEventName, .event-name');
        match.eventName = eventEl?.textContent?.trim() || null;
        
        // Extract match type (Bo1, Bo3, Bo5)
        const typeEl = matchEl.querySelector('.bestOf, .match-format');
        match.type = typeEl?.textContent?.trim() || null;
        
        // Extract teams
        const team1El = matchEl.querySelector('.team1 .team, .matchTeam:first-child .matchTeamName');
        const team2El = matchEl.querySelector('.team2 .team, .matchTeam:last-child .matchTeamName');
        match.team1 = team1El?.textContent?.trim() || null;
        match.team2 = team2El?.textContent?.trim() || null;
        
        // Extract match URL
        const linkEl = matchEl.querySelector('a.match');
        match.url = linkEl?.getAttribute('href') || null;
        
        // Extract odds if available
        const odds1El = matchEl.querySelector('.team1 .odds, .matchTeam:first-child .odds');
        const odds2El = matchEl.querySelector('.team2 .odds, .matchTeam:last-child .odds');
        match.odds1 = odds1El ? parseFloat(odds1El.textContent?.trim() || '0') : null;
        match.odds2 = odds2El ? parseFloat(odds2El.textContent?.trim() || '0') : null;
        
        // Only add matches with both teams
        if (match.team1 && match.team2) {
          matches.push(match);
        }
      } catch (err) {
        console.warn('Failed to parse individual match:', err);
      }
    });
    
    return matches;
  } catch (error) {
    console.error('Failed to parse matches:', error);
    return [];
  }
}