import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

function TestWrapper({ children }: { children: React.ReactNode }) {
  localStorage.setItem("authToken", "mock");
  localStorage.setItem("username", "test");
  localStorage.setItem("userRole", "user");
  return <MemoryRouter><AuthProvider><DataProvider>{children}</DataProvider></AuthProvider></MemoryRouter>;
}

afterEach(() => localStorage.clear());

describe("Previously uncovered components — smoke tests", () => {
  // ── Full render tests ──

  it("PublicProfile renders", async () => {
    const { default: P } = await import("@/pages/PublicProfile");
    expect(render(<MemoryRouter><P /></MemoryRouter>).container).toBeTruthy();
  });

  it("AIRecommendationModal renders (closed)", async () => {
    const { default: M } = await import("@/components/AIRecommendationModal");
    expect(render(<M open={false} onClose={() => {}} recommendation={null} loading={false} />).container).toBeTruthy();
  });

  it("CurrencySwitch renders", async () => {
    const { default: C } = await import("@/components/CurrencySwitch");
    render(<C mode="UAH" onChange={() => {}} hasUsdBets={false} />);
    expect(document.body.textContent).toContain("₴");
  });

  it("ErrorBoundary renders children", async () => {
    const { default: E } = await import("@/components/ErrorBoundary");
    expect(render(<E><div>OK</div></E>).container.textContent).toContain("OK");
  });

  it("InitialBankModal renders", async () => {
    const { default: M } = await import("@/components/InitialBankModal");
    expect(render(<M open={true} onClose={() => { }} />).container).toBeTruthy();
  });


  // ── Module load tests (import without render — validates export + dependencies) ──

  const modules = [
    ["OnboardingTour", "@/components/OnboardingTour"],
    ["SEO", "@/components/SEO"],
    ["StructuredData", "@/components/StructuredData"],
    ["PageSkeleton", "@/components/PageSkeleton"],
    ["StatCard", "@/components/StatCard"],
    ["StrategyKpiCard", "@/components/StrategyKpiCard"],
    ["MiniDonut", "@/components/MiniDonut"],
    ["PeriodComparison", "@/components/PeriodComparison"],
    ["PageHeader", "@/components/PageHeader"],
    ["ProtectedRoute", "@/components/ProtectedRoute"],
    ["BetShareCard", "@/components/BetShareCard"],
    ["BetShareModal", "@/components/BetShareModal"],
    ["CommentModal", "@/components/CommentModal"],
    ["CompletedGoalResultModal", "@/components/CompletedGoalResultModal"],
    ["ExpressDetailsModal", "@/components/ExpressDetailsModal"],
  ] as const;

  for (const [name, path] of modules) {
    it(`${name} module loads`, () => expect(import(path)).resolves.toBeDefined());
  }
});
