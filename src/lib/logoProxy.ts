/**
 * Shared logo URL proxy helper.
 *
 * The backend proxies external CDN logos at:
 *   /api/v1/{game}-matches/logo/external/{base64url}
 * where {game} is "cs2" or "dota2".
 *
 * Any URL already starting with /api/ is passed through untouched.
 * Raw external URLs are base64url-encoded and routed through the backend
 * (which avoids CORS + hotlink protection on tips.gg / HLTV CDNs).
 */

/** Normalize a game label ("CS2"/"Dota2"/"cs2"/"dota2"/"Дота"…) to "cs2"|"dota2". */
export function normalizeGameForLogo(game?: string | null): "cs2" | "dota2" {
  const g = (game || "").toLowerCase();
  if (g === "dota2" || g === "dota" || g === "дота") return "dota2";
  return "cs2";
}

export function proxyLogoUrl(
  url: string | null | undefined,
  game?: string | null,
): string | null {
  if (!url) return null;
  if (url.startsWith("/api/")) return url;
  const prefix = normalizeGameForLogo(game);
  const encoded = btoa(url)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `/api/v1/${prefix}-matches/logo/external/${encoded}`;
}
