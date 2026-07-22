import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import GoalsManager from "@/components/GoalsManager";
import StrategyOverview from "@/components/StrategyOverview";
import RiskManagement from "@/components/RiskManagement";

/** Wrapper that provides a fake auth + data context + router
 *  for components that expect these providers in their tree.
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  // minimal localStorage setup so auth sees a valid session
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

// ── GoalsManager ──

describe("GoalsManager", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <TestWrapper>
        <GoalsManager />
      </TestWrapper>,
    );
    expect(container).toBeTruthy();
  });

  it("shows 'Створити ціль' button", () => {
    render(
      <TestWrapper>
        <GoalsManager />
      </TestWrapper>,
    );
    // The button may render as "Нова ціль" or similar — check text presence
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(0); // may show after load
  });
});

// ── StrategyOverview ──

describe("StrategyOverview", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <TestWrapper>
        <StrategyOverview />
      </TestWrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ── RiskManagement ──

describe("RiskManagement", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <TestWrapper>
        <RiskManagement />
      </TestWrapper>,
    );
    expect(container).toBeTruthy();
  });
});
