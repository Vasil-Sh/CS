import { describe, it, expect } from "vitest";
import {
  getCurrencySymbol,
  isExpressBet,
  getExpressEventCount,
  humanizeBetType,
  getSelectedTeamLogo,
} from "@/components/BetTable";
import type { Bet } from "@/types/betting";

// Helper
const mkBet = (overrides: Partial<Bet> = {}): Bet =>
  ({
    result: "Pending",
    betType: "MatchWinner",
    odds: 2,
    amount: 100,
    date: "2026-07-21",
    ...overrides,
  } as unknown as Bet);

// ── getCurrencySymbol ──

describe("getCurrencySymbol", () => {
  it('returns "$" for USD', () => {
    expect(getCurrencySymbol("USD")).toBe("$");
  });

  it('returns "₴" for UAH', () => {
    expect(getCurrencySymbol("UAH")).toBe("₴");
  });

  it('returns "₴" for unknown/undefined', () => {
    expect(getCurrencySymbol()).toBe("₴");
    expect(getCurrencySymbol("EUR")).toBe("₴");
  });
});

// ── isExpressBet ──

describe("isExpressBet", () => {
  it("true when betType contains Експрес", () => {
    expect(isExpressBet(mkBet({ betType: "Експрес 3x" }))).toBe(true);
  });

  it("true when format contains x", () => {
    expect(isExpressBet(mkBet({ betType: "Winner", format: "3x" }))).toBe(true);
  });

  it("false for ordinary bets", () => {
    expect(isExpressBet(mkBet({ betType: "П1", format: "Bo3" }))).toBe(false);
  });
});

// ── getExpressEventCount ──

describe("getExpressEventCount", () => {
  it("parses 3x format", () => {
    expect(getExpressEventCount(mkBet({ format: "3x" }))).toBe(3);
  });

  it("parses 10x format", () => {
    expect(getExpressEventCount(mkBet({ format: "10x" }))).toBe(10);
  });

  it("returns 0 when no format", () => {
    expect(getExpressEventCount(mkBet({ format: "" }))).toBe(0);
  });

  it("returns 0 when format is undefined", () => {
    expect(getExpressEventCount(mkBet({ format: undefined as unknown as string }))).toBe(0);
  });
});

// ── humanizeBetType ──

describe("humanizeBetType", () => {
  it("passes through already-Ukrainian text with cleaning", () => {
    expect(humanizeBetType("П1")).toBe("П1");
  });

  it('translates MatchWinner → "Переможець матчу"', () => {
    expect(humanizeBetType("MatchWinner")).toBe("Переможець матчу");
  });

  it("translates Map patterns", () => {
    expect(humanizeBetType("Map1_tb")).toBe("Карта 1 (тотал більше)");
    expect(humanizeBetType("Map2_tm")).toBe("Карта 2 (тотал менше)");
  });

  it("translates Map with handicap", () => {
    expect(humanizeBetType("Map1_HC_T1+1.5")).toBe("Карта 1: Фора +1.5");
  });

  it("translates Over/Under", () => {
    expect(humanizeBetType("Over 2.5")).toBe("Тотал більше 2.5");
    expect(humanizeBetType("Under 1.5")).toBe("Тотал менше 1.5");
  });

  it("cleans underscores", () => {
    expect(humanizeBetType("Team_A_vs_Team_B")).toBe("Team A vs Team B");
  });
});

// ── getSelectedTeamLogo ──

describe("getSelectedTeamLogo", () => {
  it("returns logoTeam1 when selected is team1 (exact match)", () => {
    const bet = mkBet({
      team1: "NaVi",
      team2: "FaZe",
      logoTeam1: "/logos/navi.png",
      logoTeam2: "/logos/faze.png",
    });
    expect(getSelectedTeamLogo(bet, "NaVi")).toBe("/logos/navi.png");
  });

  it("returns logoTeam2 when selected is team2 (exact match)", () => {
    const bet = mkBet({
      team1: "NaVi",
      team2: "FaZe",
      logoTeam1: "/logos/navi.png",
      logoTeam2: "/logos/faze.png",
    });
    expect(getSelectedTeamLogo(bet, "FaZe")).toBe("/logos/faze.png");
  });

  it("returns null for unknown team", () => {
    const bet = mkBet({
      team1: "NaVi",
      team2: "FaZe",
      logoTeam1: "/logos/navi.png",
    });
    expect(getSelectedTeamLogo(bet, "Spirit")).toBeNull();
  });

  it("is case-insensitive", () => {
    const bet = mkBet({
      team1: "NaVi",
      team2: "FaZe",
      logoTeam1: "/logos/navi.png",
    });
    expect(getSelectedTeamLogo(bet, "navi")).toBe("/logos/navi.png");
  });

  it("matches via partial substring (e.g. '9z' inside '9z Team')", () => {
    const bet = mkBet({
      team1: "9z Team",
      team2: "FaZe",
      logoTeam1: "/logos/9z.png",
    });
    expect(getSelectedTeamLogo(bet, "9z")).toBe("/logos/9z.png");
  });

  it("matches via 'Team1 vs Team2' in match field", () => {
    const bet = mkBet({
      match: "NaVi vs FaZe",
      team1: "",
      team2: "",
      logoTeam1: "/logos/navi.png",
      logoTeam2: "/logos/faze.png",
    });
    expect(getSelectedTeamLogo(bet, "FaZe")).toBe("/logos/faze.png");
  });

  it("returns null when selectedTeam is empty", () => {
    const bet = mkBet({ logoTeam1: "/a.png" });
    expect(getSelectedTeamLogo(bet, "")).toBeNull();
  });

  it("returns null when no logos are set", () => {
    const bet = mkBet({ team1: "A", team2: "B", logoTeam1: null, logoTeam2: null });
    expect(getSelectedTeamLogo(bet, "B")).toBeNull();
  });
});
