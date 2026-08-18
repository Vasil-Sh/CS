/**
 * MSW Handlers — Mock API endpoints for tests & development.
 *
 * Перехоплює fetch-запити до MatchIQ API та повертає
 * передбачувані тестові дані без реального бекенду.
 */
import { http, HttpResponse } from "msw";

// ── Auth ────────────────────────────────────────────────

export const authHandlers = [
  http.post("*/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (body.email === "fail@test.com") {
      return HttpResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      token: "mock-access-token",
      refreshToken: "mock-refresh-token",
      user: { id: "1", email: body.email || "test@example.com", role: "user" },
    });
  }),

  http.post("*/api/auth/refresh", () => {
    return HttpResponse.json({
      token: "mock-fresh-access-token",
      refreshToken: "mock-fresh-refresh-token",
    });
  }),

  http.post("*/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    return HttpResponse.json({
      token: "mock-access-token",
      refreshToken: "mock-refresh-token",
      user: { id: "2", email: body.email || "new@example.com", role: "user" },
    });
  }),
];

// ── CS2 Matches ──────────────────────────────────────────

export const cs2Handlers = [
  http.get("*/api/v1/cs2-matches", () => {
    return HttpResponse.json([
      {
        id: 1001,
        date: new Date().toISOString(),
        link: "/matches/cs2/navi-vs-spirit",
        type: "BO3",
        score1: null,
        score2: null,
        stars: 45,
        nameTeam1: "Natus Vincere",
        nameTeam2: "Team Spirit",
        lastChangeDateTeam1: null,
        lastChangeDateTeam2: null,
        positionTeam1: null,
        positionTeam2: null,
        logoTeam1: "/api/v1/cs2-matches/logo/navi.png",
        logoTeam2: "/api/v1/cs2-matches/logo/spirit.png",
      },
      {
        id: 1002,
        date: new Date(Date.now() + 86400000).toISOString(),
        link: "/matches/cs2/g2-vs-faze",
        type: "BO5",
        score1: null,
        score2: null,
        stars: 78,
        nameTeam1: "G2 Esports",
        nameTeam2: "FaZe Clan",
        lastChangeDateTeam1: null,
        lastChangeDateTeam2: null,
        positionTeam1: null,
        positionTeam2: null,
        logoTeam1: "/api/v1/cs2-matches/logo/g2.png",
        logoTeam2: "/api/v1/cs2-matches/logo/faze.png",
      },
    ]);
  }),

  http.get("*/api/v1/cs2-matches/logo/*", async () => {
    // Return a tiny transparent SVG as placeholder
    return new HttpResponse(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#eee" rx="8"/><text x="32" y="40" text-anchor="middle" font-size="28">?</text></svg>`,
      { headers: { "Content-Type": "image/svg+xml" } },
    );
  }),
];

// ── Bankroll / User Data ─────────────────────────────────

export const bankrollHandlers = [
  http.get("*/api/v1/bankroll", () => {
    return HttpResponse.json({
      initialBank: 10000,
      currentBalance: 11250,
      currency: "UAH",
    });
  }),

  http.post("*/api/v1/bankroll", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...(body as object), id: "mock-bankroll-1" });
  }),
];

// ── Combined ──────────────────────────────────────────────

export const handlers = [...authHandlers, ...cs2Handlers, ...bankrollHandlers];
