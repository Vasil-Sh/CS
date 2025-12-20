import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const response = await fetch("https://www.hltv.org/matches", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.hltv.org/",
      },
    });

    if (!response.ok) {
      throw new Error(`HLTV status ${response.status}`);
    }

    const html = await response.text();
    console.log(`[${requestId}] HTML length: ${html.length}`);

    if (
      html.includes("Checking your browser") ||
      html.includes("cf-browser-verification")
    ) {
      throw new Error("Cloudflare challenge detected");
    }

    const matches = parseMatches(html, requestId);

    return new Response(JSON.stringify({ matches }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`[${requestId}] Error`, err.message);
    return new Response(
      JSON.stringify({ error: err.message, requestId }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseMatches(html: string, requestId: string) {
  const matches: any[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (!doc) return matches;

  const elements = doc.querySelectorAll(".upcomingMatch, .liveMatch");
  console.log(`[${requestId}] Found ${elements.length} match nodes`);

  elements.forEach((el) => {
    const team1 = el.querySelector(".team1 .team")?.textContent?.trim();
    const team2 = el.querySelector(".team2 .team")?.textContent?.trim();
    if (!team1 || !team2) return;

    const unix =
      el.getAttribute("data-zonedgrouping-entry-unix") || null;

    const link = el.querySelector("a.match")?.getAttribute("href");

    matches.push({
      team1,
      team2,
      unixTime: unix ? Number(unix) : null,
      isLive: el.classList.contains("liveMatch"),
      url: link ? `https://www.hltv.org${link}` : null,
    });
  });

  console.log(`[${requestId}] Parsed ${matches.length} matches`);
  return matches;
}