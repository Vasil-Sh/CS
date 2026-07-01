/** Smoke tests: StrategyOverview, GoalsManager, RiskManagement */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Mocks
vi.mock('@/lib/userDataService', () => ({
  UserDataService: {
    fetchBets: vi.fn(() => Promise.resolve([])),
    fetchBetStats: vi.fn(() => Promise.resolve({})),
    fetchGoals: vi.fn(() => Promise.resolve([])),
    fetchStrategies: vi.fn(() => Promise.resolve([])),
    getUserData: vi.fn(() => []),
    getTodayBets: vi.fn(() => []),
    setUserDataSync: vi.fn(),
    setUserData: vi.fn(),
    deleteGoal: vi.fn(() => Promise.resolve()),
    createGoal: vi.fn(() => Promise.resolve({})),
    updateGoal: vi.fn(() => Promise.resolve()),
    createStrategy: vi.fn(() => Promise.resolve({})),
    deleteStrategy: vi.fn(() => Promise.resolve()),
    checkAndResetDailyBets: vi.fn(),
    repairAllUserKeys: vi.fn(),
  },
}));

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(() => Promise.resolve([])),
    post: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/lib/bankrollService', () => ({
  BankrollService: { fetchBankroll: vi.fn(() => Promise.resolve({})), isInitialized: vi.fn(() => false) },
}));

vi.mock('@/lib/devLogger', () => ({ logRender: vi.fn() }));
vi.mock('@/hooks/useRiskMetrics', () => ({ useRiskMetrics: vi.fn(() => ({ completedBets: [], riskMetrics: {}, drawdownPeriods: [] })) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn(() => ({ user: { username: 'test' } })) }));
vi.mock('@/stores/appStore', () => ({ useAppStore: vi.fn(() => ({ bumpStrategy: vi.fn(), strategyVersion: 0, setPrimaryStrategyId: vi.fn(), getState: vi.fn(() => ({ bumpStrategy: vi.fn() })) })) }));
vi.mock('@/hooks/useTheme', () => ({ useTheme: vi.fn(() => ({ theme: 'light' })) }));
vi.mock('@/lib/googleSheetsRiskyTeams', () => ({ googleSheetsRiskyTeamsService: { fetchRiskyTeams: vi.fn(() => Promise.resolve([])), addTeam: vi.fn(() => Promise.resolve({})), removeTeam: vi.fn(() => Promise.resolve()) } }));

function renderWithProviders(ui: React.ReactElement) {
  return render(<HelmetProvider><BrowserRouter>{ui}</BrowserRouter></HelmetProvider>);
}

describe('StrategyOverview', () => {
  it('renders without crashing', async () => {
    const { default: StrategyOverview } = await import('@/components/StrategyOverview');
    renderWithProviders(<StrategyOverview />);
    expect(document.body).toBeDefined();
  });
});

describe('GoalsManager', () => {
  it('renders without crashing', async () => {
    const { default: GoalsManager } = await import('@/components/GoalsManager');
    renderWithProviders(<GoalsManager />);
    expect(document.body).toBeDefined();
  });
});

describe('RiskManagement', () => {
  it('renders without crashing', async () => {
    const { default: RiskManagement } = await import('@/components/RiskManagement');
    renderWithProviders(<RiskManagement bets={[]} />);
    expect(document.body).toBeDefined();
  });
});
