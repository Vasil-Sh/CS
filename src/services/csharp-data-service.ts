// Enhanced data service that integrates C# backend with existing React components

import csharpBridge from './csharp-bridge';
import { CSharpGame, CSharpTeam } from '../types/csharp-models';

interface CacheEntry {
  data: Record<string, unknown>;
  timestamp: number;
}

interface TeamStats {
  name: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentForm: string;
  recentMatches: Record<string, unknown>[];
  averageOdds: number;
  profitLoss: number;
}

interface AnalyticsData {
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  roi: number;
  recentWinRate: number;
  averageStake: number;
  bestStreak: number;
  worstStreak: number;
}

class CSharpDataService {
  private cache = new Map<string, CacheEntry>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? (Date.now() - cached.timestamp) < this.cacheTimeout : false;
  }

  private setCache(key: string, data: Record<string, unknown>): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): Record<string, unknown> | undefined {
    return this.cache.get(key)?.data;
  }

  // Get all betting data (replaces Google Sheets)
  async getBettingData(): Promise<Record<string, unknown>[]> {
    const cacheKey = 'betting-data';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey) as Record<string, unknown>[] || [];
    }

    try {
      const betsData = await csharpBridge.getBetsData();
      this.setCache(cacheKey, betsData as Record<string, unknown>);
      return betsData;
    } catch (error) {
      console.error('Error fetching betting data from C#:', error);
      return this.getFallbackBettingData();
    }
  }

  // Get teams data
  async getTeamsData(): Promise<Record<string, unknown>[]> {
    const cacheKey = 'teams-data';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey) as Record<string, unknown>[] || [];
    }

    try {
      const teamsData = await csharpBridge.getTeamsData();
      this.setCache(cacheKey, teamsData as Record<string, unknown>);
      return teamsData;
    } catch (error) {
      console.error('Error fetching teams data from C#:', error);
      return this.getFallbackTeamsData();
    }
  }

  // Get team statistics
  async getTeamStats(teamName: string): Promise<TeamStats> {
    const cacheKey = `team-stats-${teamName}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey) as TeamStats || this.getFallbackTeamStats(teamName);
    }

    try {
      const matches = await csharpBridge.getTeamMatches(teamName);
      const stats = this.calculateTeamStats(matches, teamName);
      this.setCache(cacheKey, stats as Record<string, unknown>);
      return stats;
    } catch (error) {
      console.error(`Error fetching stats for ${teamName}:`, error);
      return this.getFallbackTeamStats(teamName);
    }
  }

  // Calculate team statistics from matches
  private calculateTeamStats(matches: Record<string, unknown>[], teamName: string): TeamStats {
    if (!matches.length) return this.getFallbackTeamStats(teamName);

    const wins = matches.filter(match => 
      (match.team1 === teamName && match.result === 'win') ||
      (match.team2 === teamName && match.result === 'win')
    ).length;

    const totalMatches = matches.length;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    const recentMatches = matches.slice(0, 5);
    const recentWins = recentMatches.filter(match => 
      (match.team1 === teamName && match.result === 'win') ||
      (match.team2 === teamName && match.result === 'win')
    ).length;

    return {
      name: teamName,
      totalMatches,
      wins,
      losses: totalMatches - wins,
      winRate: Math.round(winRate),
      recentForm: `${recentWins}W-${recentMatches.length - recentWins}L`,
      recentMatches: recentMatches.slice(0, 3),
      averageOdds: matches.reduce((sum, match) => sum + (Number(match.odds) || 1.5), 0) / totalMatches || 1.5,
      profitLoss: matches.reduce((sum, match) => sum + (Number(match.profit) || 0), 0)
    };
  }

  // Get analytics data
  async getAnalyticsData(): Promise<AnalyticsData> {
    const cacheKey = 'analytics-data';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey) as AnalyticsData || this.getFallbackAnalytics();
    }

    try {
      const betsData = await this.getBettingData();
      const analytics = this.calculateAnalytics(betsData);
      this.setCache(cacheKey, analytics as Record<string, unknown>);
      return analytics;
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return this.getFallbackAnalytics();
    }
  }

  // Calculate analytics from betting data
  private calculateAnalytics(betsData: Record<string, unknown>[]): AnalyticsData {
    if (!betsData.length) return this.getFallbackAnalytics();

    const totalBets = betsData.length;
    const wins = betsData.filter(bet => bet.result === 'win').length;
    const losses = totalBets - wins;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    
    const totalProfit = betsData.reduce((sum, bet) => sum + (Number(bet.profit) || 0), 0);
    const totalStake = betsData.reduce((sum, bet) => sum + (Number(bet.stake) || 100), 0);
    const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;

    const recentBets = betsData.slice(0, 10);
    const recentWins = recentBets.filter(bet => bet.result === 'win').length;
    const recentWinRate = recentBets.length > 0 ? (recentWins / recentBets.length) * 100 : 0;

    return {
      totalBets,
      wins,
      losses,
      winRate: Math.round(winRate),
      totalProfit: Math.round(totalProfit),
      roi: Math.round(roi * 100) / 100,
      recentWinRate: Math.round(recentWinRate),
      averageStake: Math.round(totalStake / totalBets) || 100,
      bestStreak: this.calculateBestStreak(betsData),
      worstStreak: this.calculateWorstStreak(betsData)
    };
  }

  private calculateBestStreak(betsData: Record<string, unknown>[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const bet of betsData) {
      if (bet.result === 'win') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }

  private calculateWorstStreak(betsData: Record<string, unknown>[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const bet of betsData) {
      if (bet.result === 'loss') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }

  // Fallback data for when C# backend is not available
  private getFallbackBettingData(): Record<string, unknown>[] {
    return [
      {
        id: '1',
        date: new Date().toISOString(),
        team1: 'NAVI',
        team2: 'Astralis',
        bet: 'NAVI',
        odds: 1.8,
        stake: 100,
        result: 'win',
        profit: 80,
        matchScore: '2-1',
        tournament: 'IEM Katowice',
        confidence: 85
      }
    ];
  }

  private getFallbackTeamsData(): Record<string, unknown>[] {
    return [
      { name: 'NAVI', rank: 1, rating: 1000, tier: 'S' },
      { name: 'Astralis', rank: 2, rating: 950, tier: 'S' },
      { name: 'FaZe', rank: 3, rating: 900, tier: 'S' }
    ];
  }

  private getFallbackTeamStats(teamName: string): TeamStats {
    return {
      name: teamName,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      recentForm: '0W-0L',
      recentMatches: [],
      averageOdds: 1.5,
      profitLoss: 0
    };
  }

  private getFallbackAnalytics(): AnalyticsData {
    return {
      totalBets: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalProfit: 0,
      roi: 0,
      recentWinRate: 0,
      averageStake: 100,
      bestStreak: 0,
      worstStreak: 0
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get connection status
  getConnectionStatus(): { connected: boolean; environment: string } {
    return csharpBridge.getStatus();
  }
}

// Export singleton instance
export const csharpDataService = new CSharpDataService();
export default csharpDataService;