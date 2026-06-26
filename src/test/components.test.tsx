/** Test suite for strategy sub-components */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StrategyLoadingSkeleton from '@/components/strategy/StrategyLoadingSkeleton';

describe('StrategyLoadingSkeleton', () => {
  it('renders loading placeholder blocks', () => {
    const { container } = render(<StrategyLoadingSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
    expect(container.querySelectorAll('[class*="rounded-"]').length).toBeGreaterThanOrEqual(3);
  });
});

import StrategyEmptyState from '@/components/strategy/StrategyEmptyState';

describe('StrategyEmptyState', () => {
  it('renders create button', () => {
    render(<StrategyEmptyState onCreateStrategy={vi.fn()} />);
    expect(screen.getByText('Немає стратегій')).toBeTruthy();
    expect(screen.getByText('Створити стратегію')).toBeTruthy();
  });

  it('calls onCreateStrategy on button click', () => {
    const fn = vi.fn();
    render(<StrategyEmptyState onCreateStrategy={fn} />);
    screen.getByText('Створити стратегію').click();
    expect(fn).toHaveBeenCalledOnce();
  });
});

import StrategyFilters from '@/components/strategy/StrategyFilters';

describe('StrategyFilters', () => {
  const props = {
    searchQuery: '', riskFilter: 'all', sortBy: 'roi' as const, sortOrder: 'desc' as const,
    onSearchChange: vi.fn(), onRiskFilterChange: vi.fn(), onSortByChange: vi.fn(), onSortOrderToggle: vi.fn(),
  };

  it('renders search input', () => {
    render(<StrategyFilters {...props} />);
    expect(screen.getByPlaceholderText('Пошук стратегій...')).toBeTruthy();
  });
});

import TrendIndicator from '@/components/strategy/TrendIndicator';

describe('TrendIndicator', () => {
  it('returns null when profitHistory has <2 entries', () => {
    const { container } = render(<TrendIndicator stats={{ totalBets: 0, wins: 0, losses: 0, pending: 0, totalProfit: 0, totalStake: 0, winRate: 0, roi: 0 }} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders trend indicator with enough data', () => {
    const { container } = render(<TrendIndicator stats={{ totalBets: 2, wins: 1, losses: 1, pending: 0, totalProfit: 100, totalStake: 50, winRate: 50, roi: 10, profitHistory: [10, 20] }} />);
    expect(container.textContent).toContain('100.0%');
  });
});

import GoalsEmptyState from '@/components/goals/GoalsEmptyState';

describe('GoalsEmptyState', () => {
  it('renders active empty state', () => {
    render(<GoalsEmptyState type="active" onCreateGoal={vi.fn()} />);
    expect(screen.getByText('Немає активних цілей')).toBeTruthy();
  });

  it('renders completed empty state', () => {
    render(<GoalsEmptyState type="completed" onCreateGoal={vi.fn()} />);
    expect(screen.getByText('Немає завершених цілей')).toBeTruthy();
  });
});

import DeleteGoalDialog from '@/components/goals/DeleteGoalDialog';

describe('DeleteGoalDialog', () => {
  it('shows goal name in dialog', () => {
    render(<DeleteGoalDialog open={true} onOpenChange={vi.fn()} goalName="Test Goal" onDelete={vi.fn()} />);
    expect(screen.getByText(/Test Goal/)).toBeTruthy();
  });

  it('calls onDelete when delete button clicked', () => {
    const fn = vi.fn();
    render(<DeleteGoalDialog open={true} onOpenChange={vi.fn()} goalName="Test" onDelete={fn} />);
    screen.getByText('Видалити').click();
    expect(fn).toHaveBeenCalledOnce();
  });
});

import { MatchesLoadingState, MatchesEmptyState } from '@/components/matches/MatchStates';

describe('MatchStates', () => {
  it('MatchesLoadingState renders loading text', () => {
    render(<MatchesLoadingState />);
    expect(screen.getByText('Завантаження матчів')).toBeTruthy();
  });

  it('MatchesEmptyState renders without error', () => {
    render(<MatchesEmptyState />);
    expect(screen.getByText('Матчів не знайдено')).toBeTruthy();
  });

  it('MatchesEmptyState renders with error', () => {
    render(<MatchesEmptyState error="API Error" />);
    expect(screen.getByText('Помилка завантаження')).toBeTruthy();
    expect(screen.getByText('API Error')).toBeTruthy();
  });
});
