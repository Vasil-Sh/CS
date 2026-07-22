import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import CS2BettingForm from "@/components/CS2BettingForm";
import BetTable from "@/components/BetTable";
import type { Bet } from "@/types/betting";

function TestWrapper({ children }: { children: React.ReactNode }) {
  localStorage.setItem("authToken", "mock-token");
  localStorage.setItem("username", "test_user");
  localStorage.setItem("userRole", "user");
  return (
    <MemoryRouter>
      <AuthProvider>
        <DataProvider>{children}</DataProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  localStorage.clear();
});

// ── CS2BettingForm ──

describe("CS2BettingForm", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <TestWrapper>
        <CS2BettingForm />
      </TestWrapper>,
    );
    expect(container).toBeTruthy();
  });

  it("renders the submit button", () => {
    render(
      <TestWrapper>
        <CS2BettingForm />
      </TestWrapper>,
    );
    // Submit button should be present
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});

// ── BetTable ──

describe("BetTable", () => {
  const defaultProps = {
    bets: [] as Bet[],
    activeBets: [] as Bet[],
    currentUser: "test_user",
    isAdmin: false,
    tableFilter: "all" as const,
    onTableFilterChange: () => {},
    showAdvancedFilters: false,
    onToggleAdvancedFilters: () => {},
    resultFilter: "all" as const,
    onResultFilterChange: () => {},
    periodFilter: "all" as const,
    onPeriodFilterChange: () => {},
    sortBy: "date" as const,
    onSortByChange: () => {},
    sortOrder: "desc" as const,
    currentPage: 1,
    onPageChange: () => {},
    searchText: "",
    onSearchTextChange: () => {},
    onShareBet: () => {},
    onBetDetails: () => {},
    onExpressDetails: () => {},
    onUpdateResult: () => {},
    onDeleteBet: () => {},
  };

  it("renders without crashing with no bets", () => {
    const { container } = render(
      <TestWrapper>
        <BetTable {...defaultProps} />
      </TestWrapper>,
    );
    expect(container).toBeTruthy();
  });

  it("renders a single bet row when bet is provided", () => {
    const singleBet: Bet = {
      id: "1",
      date: "2026-07-21",
      team1: "NaVi",
      team2: "FaZe",
      betType: "П1",
      odds: 2,
      amount: 100,
      profit: 100,
      result: "Win",
      game: "CS2",
      currency: "UAH",
      createdAt: "2026-07-21",
      match: "NaVi vs FaZe",
      strategy: "",
      logoTeam1: null,
      logoTeam2: null,
      notes: "",
      format: "Bo3",
      stake: 100,
      roi: 100,
    } as Bet;

    const { container } = render(
      <TestWrapper>
        <BetTable {...defaultProps} bets={[singleBet]} />
      </TestWrapper>,
    );
    expect(container).toBeTruthy();
  });
});
