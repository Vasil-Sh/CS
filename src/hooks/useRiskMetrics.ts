import { useMemo } from 'react';
import type { Bet } from '@/types/betting';

export interface RiskMetrics {
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  valueAtRisk: number;
  kellyPercentage: number;
  riskOfRuin: number;
  consecutiveLosses: number;
  averageStake: number;
  maxStake: number;
  bankrollGrowth: number;
  largestLoss: number;
  winStreakRisk: number;
}

export interface DrawdownPeriod {
  start: string;
  end: string;
  duration: number;
  maxDrawdown: number;
  recovery: boolean;
}

export function useRiskMetrics(bets: Bet[]) {
  const completedBets = useMemo(() =>
    bets.filter(bet => bet.result && bet.result !== 'Pending'),
    [bets]
  );

  const riskMetrics = useMemo((): RiskMetrics => {
    if (completedBets.length === 0) {
      return {
        maxDrawdown: 0,
        currentDrawdown: 0,
        sharpeRatio: 0,
        volatility: 0,
        valueAtRisk: 0,
        kellyPercentage: 0,
        riskOfRuin: 0,
        consecutiveLosses: 0,
        averageStake: 0,
        maxStake: 0,
        bankrollGrowth: 0,
        largestLoss: 0,
        winStreakRisk: 0
      };
    }

    const bankroll = 10000;
    let runningBalance = bankroll;
    let peak = bankroll;
    let maxDrawdown = 0;
    let maxConsecutiveLosses = 0;
    let currentLossStreak = 0;
    // Win streak tracking (computed in same pass)
    let currentWinStreak = 0;
    const winStreaks: number[] = [];
    // Accumulators for single-pass stats
    let sumReturns = 0;
    let sumSquares = 0;
    let sumStakes = 0;
    let maxStake = 0;
    let winCount = 0;
    let winReturnSum = 0;
    let winReturnCount = 0;
    let lossReturnSum = 0;
    let lossReturnCount = 0;
    let minReturn = Infinity;

    const returns: number[] = [];

    completedBets.forEach(bet => {
      const profit = bet.profit || 0;
      const stake = bet.stake || 0;

      runningBalance += profit;

      if (stake > 0) {
        returns.push(profit / stake);
        const ret = profit / stake;
        sumReturns += ret;
        sumStakes += stake;
        maxStake = Math.max(maxStake, stake);
        if (ret < minReturn) minReturn = ret;
      }

      if (runningBalance > peak) {
        peak = runningBalance;
      }

      const currentDD = (peak - runningBalance) / peak * 100;
      if (currentDD > maxDrawdown) {
        maxDrawdown = currentDD;
      }

      if (bet.result === 'Loss') {
        currentLossStreak++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
        currentWinStreak = 0;
      } else {
        currentLossStreak = 0;
        if (bet.result === 'Win') {
          currentWinStreak++;
          winCount++;
        }
        if (currentWinStreak > 0) {
          winStreaks.push(currentWinStreak);
        }
      }
    });

    const currentDrawdown = (peak - runningBalance) / peak * 100;

    // Compute variance from returns
    const avgReturn = returns.length > 0 ? sumReturns / returns.length : 0;
    if (returns.length > 0) {
      for (const ret of returns) {
        sumSquares += Math.pow(ret - avgReturn, 2);
      }
    }
    const variance = returns.length > 0 ? sumSquares / returns.length : 0;
    const volatility = Math.sqrt(variance) * 100;

    const riskFreeRate = 0.02;
    const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / (volatility / 100) : 0;

    // VaR from sorted returns
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(sortedReturns.length * 0.05);
    const valueAtRisk = sortedReturns.length > 0 ? Math.abs(sortedReturns[varIndex] || 0) * 100 : 0;

    // Win/Loss stats (computed from accumulators in first pass for Kelly)
    const winRate = completedBets.filter(bet => bet.result === 'Win').length / completedBets.length;
    // Single pass for win/loss averages using for-of on returns
    let avgWinSum = 0, avgWinCount = 0, avgLossSum = 0, avgLossCount = 0;
    for (const r of returns) {
      if (r > 0) { avgWinSum += r; avgWinCount++; }
      else if (r < 0) { avgLossSum += Math.abs(r); avgLossCount++; }
    }
    const avgWinReturn = avgWinCount > 0 ? avgWinSum / avgWinCount : 0;
    const avgLossReturn = avgLossCount > 0 ? avgLossSum / avgLossCount : 0;

    const kellyPercentage = avgLossReturn > 0 ?
      Math.max(0, (winRate * avgWinReturn - (1 - winRate) * avgLossReturn) / avgWinReturn * 100) : 0;

    const avgStake = sumStakes > 0 ? sumStakes / returns.filter(r => !isNaN(r)).length || 1 : 0;
    const riskOfRuin = winRate < 0.5 ?
      Math.min(100, Math.pow((1 - winRate) / winRate, bankroll / (avgStake || 1)) * 100) : 0;

    const largestLoss = Math.abs(minReturn !== Infinity ? minReturn * avgStake : 0);

    const avgWinStreak = winStreaks.length > 0 ? winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length : 0;
    const winStreakRisk = avgWinStreak > 5 ? Math.min(100, avgWinStreak * 10) : 0;

    return {
      maxDrawdown: isFinite(maxDrawdown) ? Number(maxDrawdown.toFixed(2)) : 0,
      currentDrawdown: isFinite(currentDrawdown) ? Number(Math.max(0, currentDrawdown).toFixed(2)) : 0,
      sharpeRatio: isFinite(sharpeRatio) ? Number(sharpeRatio.toFixed(2)) : 0,
      volatility: isFinite(volatility) ? Number(volatility.toFixed(2)) : 0,
      valueAtRisk: isFinite(valueAtRisk) ? Number(valueAtRisk.toFixed(2)) : 0,
      kellyPercentage: isFinite(kellyPercentage) ? Number(kellyPercentage.toFixed(2)) : 0,
      riskOfRuin: isFinite(riskOfRuin) ? Number(riskOfRuin.toFixed(2)) : 0,
      consecutiveLosses: maxConsecutiveLosses,
      averageStake: completedBets.filter(b => (b.stake || 0) > 0).length > 0
        ? Number((sumStakes / completedBets.filter(b => (b.stake || 0) > 0).length).toFixed(2)) : 0,
      maxStake,
      bankrollGrowth: isFinite((runningBalance - bankroll) / bankroll * 100) ? Number(((runningBalance - bankroll) / bankroll * 100).toFixed(2)) : 0,
      largestLoss: isFinite(largestLoss) ? Number(largestLoss.toFixed(2)) : 0,
      winStreakRisk: isFinite(winStreakRisk) ? Number(winStreakRisk.toFixed(2)) : 0
    };
  }, [completedBets]);

  const drawdownPeriods = useMemo((): DrawdownPeriod[] => {
    if (completedBets.length === 0) return [];

    const bankroll = 10000;
    let runningBalance = bankroll;
    let peak = bankroll;
    let drawdownStart: string | null = null;
    let maxDrawdownInPeriod = 0;
    const periods: DrawdownPeriod[] = [];

    completedBets.forEach((bet, index) => {
      const profit = bet.profit || 0;
      runningBalance += profit;

      if (runningBalance > peak) {
        if (drawdownStart) {
          periods.push({
            start: drawdownStart,
            end: bet.date,
            duration: index - completedBets.findIndex(b => b.date === drawdownStart),
            maxDrawdown: maxDrawdownInPeriod,
            recovery: true
          });
          drawdownStart = null;
          maxDrawdownInPeriod = 0;
        }
        peak = runningBalance;
      } else if (runningBalance < peak) {
        if (!drawdownStart) {
          drawdownStart = bet.date;
        }
        const currentDD = (peak - runningBalance) / peak * 100;
        maxDrawdownInPeriod = Math.max(maxDrawdownInPeriod, currentDD);
      }
    });

    if (drawdownStart) {
      periods.push({
        start: drawdownStart,
        end: completedBets[completedBets.length - 1]?.date || '',
        duration: completedBets.length - completedBets.findIndex(b => b.date === drawdownStart),
        maxDrawdown: maxDrawdownInPeriod,
        recovery: false
      });
    }

    return periods.sort((a, b) => b.maxDrawdown - a.maxDrawdown).slice(0, 5);
  }, [completedBets]);

  return { completedBets, riskMetrics, drawdownPeriods };
}
