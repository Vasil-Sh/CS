import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Bet } from "@/types/betting";
import type { RiskyTeam, ValueBetAnalysis, KellyData } from "@/components/BettingSidebar";

import BetDetailsModal from "@/components/BetDetailsModal";
import { BettingSidebar } from "@/components/BettingSidebar";

describe("BetDetailsModal", () => {
  const mkBet = (overrides: Partial<Bet> = {}): Bet => ({
    id: "1", date: "2026-07-21", team1: "NaVi", team2: "FaZe", betType: "П1",
    odds: 2, amount: 100, profit: 100, result: "Win", game: "CS2", currency: "UAH",
    match: "NaVi vs FaZe", format: "Bo3", notes: "", logoTeam1: null, logoTeam2: null,
    selection: "NaVi", ...overrides,
  } as unknown as Bet);

  it("returns null for null bet", () => {
    const { container } = render(<BetDetailsModal bet={null} open={true} onClose={() => {}} />);
    expect(container.querySelector("textarea")).toBeNull();
  });

  it("renders modal when open with bet", () => {
    const { container } = render(<BetDetailsModal bet={mkBet()} open={true} onClose={() => {}} />);
    expect(container).toBeTruthy();
  });
});

describe("BettingSidebar", () => {
  const noop = () => {};
  it("renders without crashing", () => {
    const { container } = render(<BettingSidebar
      stake="100" odds="2.00" confidence="60" betCategory="Ординар" currency="UAH"
      totalExpressOdds={1} expressEventsCount={0} potentialProfit="100"
      potentialProfitInCurrency="100₴" expectedValue="20"
      evVerdict={{ label: "OK", color: "text-green-500" }}
      isValuePositive={true}
      valueBetAnalysis={null as ValueBetAnalysis | null}
      kellyData={null as KellyData | null}
      overconfidenceWarning={null}
      hasConfidence={true} isHighConfidence={false}
      riskyTeams={[] as RiskyTeam[]}
      maxStakePercent={5}
      onMaxStakePercentChange={noop} onApplyKellyAmount={noop} onRemoveRiskyTeam={noop}
    />);
    expect(container).toBeTruthy();
  });
});
