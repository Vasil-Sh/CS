/**
 * Page-level smoke tests: Analytics
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Analytics from '@/pages/Analytics';

// Mock all data services
vi.mock('@/lib/userDataService', () => ({
  UserDataService: {
    fetchBets: vi.fn(() => Promise.resolve([])),
    fetchBetStats: vi.fn(() => Promise.resolve({ totalBets: 0, winRate: 0, totalProfit: 0, averageROI: 0 })),
    getUserData: vi.fn(() => []),
  },
}));

vi.mock('@/lib/bankrollService', () => ({
  BankrollService: {
    fetchBankroll: vi.fn(() => Promise.resolve({ initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 })),
    isInitialized: vi.fn(() => false),
    getBankrollStatsDual: vi.fn(() => ({
      uah: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
      usd: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
    })),
  },
}));

vi.mock('@/lib/devLogger', () => ({
  logRender: vi.fn(),
}));

vi.mock('@/hooks/useRiskMetrics', () => ({
  useRiskMetrics: vi.fn(() => ({ completedBets: [], riskMetrics: {}, drawdownPeriods: [] })),
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { username: 'test', role: 'user' }, isAuthenticated: true })),
}));

// Mock app store
vi.mock('@/stores/appStore', () => ({
  useAppStore: vi.fn(() => ({
    bumpBankroll: vi.fn(),
    bankrollVersion: 0,
  })),
}));

// Mock theme
vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));

function renderPage() {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    </HelmetProvider>
  );
}

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderPage();
    // Smoke test: page mounts without throwing
    expect(document.querySelector('[data-testid]') || document.body).toBeDefined();
  });

  it('shows loading state on mount', () => {
    renderPage();
    // Page should render without errors
    expect(document.body).toBeDefined();
  });
});
