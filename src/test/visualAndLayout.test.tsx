import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "@/components/Layout";
import BankSparkline from "@/components/AnalyticsSparklines";
import OnboardingTour from "@/components/OnboardingTour";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

function TestWrapper({ children }: { children: React.ReactNode }) {
  localStorage.setItem("authToken", "mock-token");
  localStorage.setItem("username", "test_user");
  localStorage.setItem("userRole", "user");
  return (
    <MemoryRouter initialEntries={["/app/matches"]}>
      <AuthProvider>
        <DataProvider>{children}</DataProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

afterEach(() => localStorage.clear());

describe("Layout", () => {
  it("renders without crashing", () => {
    const { container } = render(<TestWrapper><Layout /></TestWrapper>);
    expect(container).toBeTruthy();
  });

  it("renders navigation with links", () => {
    render(<TestWrapper><Layout /></TestWrapper>);
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });
});

describe("OnboardingTour", () => {
  it("does not render when already completed", () => {
    localStorage.setItem("matchiq_onboarding_completed", "true");
    render(<TestWrapper><OnboardingTour /></TestWrapper>);
    expect(screen.queryByText(/команди/)).toBeNull();
  });
});

describe("BankSparkline", () => {
  it("renders SVG", () => {
    const { container } = render(<BankSparkline data={[{balance:10000},{balance:10500}]} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders with empty data", () => {
    const { container } = render(<BankSparkline data={[]} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("upward trend = blue", () => {
    const { container } = render(<BankSparkline data={[{balance:10000},{balance:12000}]} />);
    expect(container.querySelector("path[fill]")?.getAttribute("fill") || "").toContain("252");
  });
});

import { ProfitSparkline } from "@/components/AnalyticsSparklines";

describe("ProfitSparkline", () => {
  it("renders SVG", () => {
    const { container } = render(<ProfitSparkline bets={[]} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("green for today-positive", () => {
    const today = new Date().toISOString().split("T")[0];
    const { container } = render(<ProfitSparkline bets={[{date:today,profit:500}]} />);
    expect(container.querySelector("path[fill]")?.getAttribute("fill") || "").toContain("197,94");
  });

  it("red for 7 days negative", () => {
    const bets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      bets.push({ date: d.toISOString().split("T")[0], profit: -100 });
    }
    const { container } = render(<ProfitSparkline bets={bets} />);
    expect(container.querySelector("path[fill]")?.getAttribute("fill") || "").toContain("239,68,68");
  });
});

import Telegram from "@/pages/Telegram";

describe("Telegram", () => {
  it("renders without crashing", () => {
    const { container } = render(<TestWrapper><Telegram /></TestWrapper>);
    expect(container).toBeTruthy();
  });

  it("renders page header", () => {
    render(<TestWrapper><Telegram /></TestWrapper>);
    expect(screen.getByText("Telegram")).toBeTruthy();
  });
});

import PublicProfile from "@/pages/PublicProfile";

describe("PublicProfile", () => {
  it("renders without crashing", () => {
    const { container } = render(<MemoryRouter><PublicProfile /></MemoryRouter>);
    expect(container).toBeTruthy();
  });
});
