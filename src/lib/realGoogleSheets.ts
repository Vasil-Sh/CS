// Real Google Sheets integration for CS2 Analytics
import { SPREADSHEET_ID_DATA } from './sheetsConfig';
import { logServiceCall } from './devLogger';

export interface CS2BettingRecord {
  date: string;
  match: string;
  team1: string;
  team2: string;
  betType: string;
  odds: number;
  amount: number;
  result: 'Win' | 'Loss' | 'Pending';
  profit: number;
  roi: number;
  strategy: string;
  notes: string;
  format?: string;
  game?: string;
  tournament?: string;
  matchUrl?: string;
  riskyTeams?: string[];
  id?: string;
  goalId?: string;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number | null;
  originalProfit?: number;
  createdAt?: number; // ДОДАНО: timestamp для точного сортування
  winProbability?: number; // ДОДАНО: імовірність виграшу
}

export type ActionMode = 'warning' | 'block';

export interface OddsControl {
  enabled: boolean;
  minOdds?: number;
  maxOdds?: number;
  separateForExpress?: boolean;
  expressMinOdds?: number;
  expressMaxOdds?: number;
  actionMode: ActionMode;
}

export interface BetTypeRules {
  enabled: boolean;
  allowedTypes: string[]; // ['Ординар', 'Експрес', 'Система']
  maxEventsInExpress?: number;
  minTotalExpressOdds?: number;
  actionMode: ActionMode;
}

export interface MatchFormatRules {
  enabled: boolean;
  allowedFormats: string[]; // ['BO1', 'BO3', 'BO5']
  actionMode: ActionMode;
}

export interface ActivityLimits {
  enabled: boolean;
  maxBetsPerDay?: number;
  maxBetsPerMatch?: number;
  minPauseBetweenBets?: number; // in minutes
  blockAfterLosses?: number;
  blockDurationMinutes?: number; // how long to block after hitting the limit, default 60
  actionMode: ActionMode;
}

export interface PsychologicalTriggers {
  enabled: boolean;
  warnOnLossStreak?: number; // warn after N losses
  warnOnHighOdds?: number; // warn if odds > N
  warnOnRepeatTeam?: boolean; // warn if betting on same team twice in a day
  actionMode: ActionMode;
}

export interface CS2Strategy {
  id?: string;
  name: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedROI: number;
  
  // New rule groups
  oddsControl?: OddsControl;
  betTypeRules?: BetTypeRules;
  matchFormatRules?: MatchFormatRules;
  activityLimits?: ActivityLimits;
  psychologicalTriggers?: PsychologicalTriggers;
  
  // Custom rules (text-based)
  customRules?: string[];
  
  // Legacy fields (for backward compatibility, will be removed)
  criteria?: string[];
  maxOdds?: number;
  minOdds?: number;
  allowedFormats?: string[];
  allowedBetTypes?: string[];
}

interface GoogleSheetsResponse {
  values?: string[][];
}

/** Helper to find a bet index using id/createdAt first, then fallback to field matching */
function findBetIndex(records: CS2BettingRecord[], bet: CS2BettingRecord): number {
  // Try matching by id first (most reliable)
  if (bet.id) {
    const idx = records.findIndex(r => r.id === bet.id);
    if (idx !== -1) return idx;
  }
  // Try matching by createdAt
  if (bet.createdAt) {
    const idx = records.findIndex(r => r.createdAt === bet.createdAt);
    if (idx !== -1) return idx;
  }
  // Fallback: match by date + amount + odds + Pending status (works for Express & regular bets)
  return records.findIndex(r =>
    r.date === bet.date &&
    r.amount === bet.amount &&
    r.odds === bet.odds &&
    r.result === 'Pending'
  );
}

class RealGoogleSheetsService {
  private spreadsheetId: string = SPREADSHEET_ID_DATA;
  private apiKey: string = '';

  // Set API key for Google Sheets access
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Fetch data from your Google Sheets (USDT tab)
  async fetchUSDTData(): Promise<CS2BettingRecord[]> {
    try {
      if (!this.apiKey) {
        const username = localStorage.getItem('username') || '';
        console.warn('Google Sheets API key not set, using localStorage data');
        return username ? this.getUserBets(username) : [];
      }

      const range = 'USDT!A:Z'; // Adjust range as needed
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data: GoogleSheetsResponse = await response.json();
      
      if (data.values) {
        // Process the raw data from your sheets
        return this.processSheetData(data.values);
      }
      
      const username = localStorage.getItem('username') || '';
      return username ? this.getUserBets(username) : [];
    } catch (error) {
      logServiceCall('RealGoogleSheets', 'fetchUSDTData');
      console.error('Error fetching USDT data:', error);
      const username = localStorage.getItem('username') || '';
      return username ? this.getUserBets(username) : [];
    }
  }

  /** Get current user's bets from user-scoped storage */
  private getUserBets(username: string): CS2BettingRecord[] {
    try {
      const raw = localStorage.getItem(`user_${username}_mybets_data`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Fetch data from your Google Sheets (My Strategy tab)
  async fetchStrategyData(): Promise<CS2Strategy[]> {
    try {
      if (!this.apiKey) {
        console.warn('Google Sheets API key not set, using mock strategy data');
        return this.getMockStrategyData();
      }

      const range = 'My Strategy!A:Z';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data: GoogleSheetsResponse = await response.json();
      
      if (data.values) {
        return this.processStrategyData(data.values);
      }
      
      return this.getMockStrategyData();
    } catch (error) {
      logServiceCall('RealGoogleSheets', 'fetchStrategyData');
      console.error('Error fetching strategy data:', error);
      return this.getMockStrategyData();
    }
  }

  // Process raw sheet data into structured format
  private processSheetData(rawData: string[][]): CS2BettingRecord[] {
    if (rawData.length < 2) return [];
    
    const records: CS2BettingRecord[] = [];
    
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (row.length === 0) continue;
      
      const record: CS2BettingRecord = {
        date: row[0] || '',
        match: row[1] || '',
        team1: row[2] || '',
        team2: row[3] || '',
        betType: row[4] || '',
        odds: parseFloat(row[5]) || 0,
        amount: parseFloat(row[6]) || 0,
        result: (row[7] as 'Win' | 'Loss' | 'Pending') || 'Pending',
        profit: parseFloat(row[8]) || 0,
        roi: parseFloat(row[9]) || 0,
        strategy: row[10] || '',
        notes: row[11] || '',
        format: row[12] || 'BO3',
        tournament: row[13] || '',
        matchUrl: row[14] || ''
      };
      
      records.push(record);
    }
    
    return records;
  }

  // Process strategy data from sheets
  private processStrategyData(rawData: string[][]): CS2Strategy[] {
    const strategies: CS2Strategy[] = [
      {
        name: 'Блок 1: Основна стратегія',
        description: 'Базова стратегія для ставок на CS2 матчі',
        riskLevel: 'Medium',
        expectedROI: 15
      }
    ];
    
    return strategies;
  }

  // Mock strategy data for demo
  private getMockStrategyData(): CS2Strategy[] {
    return [];
  }

  // Get strategy by name or ID (user-scoped with shared fallback)
  getStrategyByName(nameOrId: string): CS2Strategy | null {
    try {
      const currentUser = localStorage.getItem('username') || localStorage.getItem('currentUser') || '';
      let strategies: CS2Strategy[] = [];
      if (currentUser) {
        strategies = JSON.parse(localStorage.getItem(`user_${currentUser}_strategies_data`) || '[]');
      }
      // Fallback: old shared key
      if (strategies.length === 0) {
        const shared = localStorage.getItem('customStrategies');
        if (shared) strategies = JSON.parse(shared);
      }

      const foundByName = strategies.find((s: CS2Strategy) => s.name === nameOrId || s.id === nameOrId);
      if (foundByName) return foundByName;
      
      return null;
    } catch (error) {
      logServiceCall('RealGoogleSheets', 'getStrategy');
      console.error('Error getting strategy:', error);
      return null;
    }
  }

  // Delete a single record by id or by index match (date+match+amount+odds)
  deleteRecord(record: Partial<CS2BettingRecord>): void {
    const username = localStorage.getItem('username') || '';
    if (!username) return;

    const key = `user_${username}_mybets_data`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const items: CS2BettingRecord[] = JSON.parse(raw);
    const idx = items.findIndex((r: CS2BettingRecord) => {
      if (record.id && r.id === record.id) return true;
      return r.date === record.date && r.match === record.match && r.amount === record.amount && r.odds === record.odds;
    });
    if (idx !== -1) {
      items.splice(idx, 1);
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  // Get all records (синхронний метод для сумісності)
  getAllRecords(): CS2BettingRecord[] {
    logServiceCall('GoogleSheets', 'getAllRecords');
    try {
      const username = localStorage.getItem('username') || '';
      if (username) {
        return this.getUserBets(username);
      }
      return [];
    } catch (error) {
      logServiceCall('RealGoogleSheets', 'getAllRecords');
      console.error('Error in getAllRecords:', error);
      return [];
    }
  }

  // Add new record with timestamp — user-scoped only
  async addRecord(record: Partial<CS2BettingRecord>): Promise<void> {
    try {
      const timestamp = Date.now();
      
      const newRecord: CS2BettingRecord = {
        date: record.date || new Date().toISOString().split('T')[0],
        match: record.match || '',
        team1: record.team1 || '',
        team2: record.team2 || '',
        betType: record.betType || '',
        odds: record.odds || 0,
        amount: record.amount || 0,
        result: record.result || 'Pending',
        profit: record.profit || 0,
        roi: record.roi || 0,
        strategy: record.strategy || '',
        notes: record.notes || '',
        format: record.format,
        game: record.game,
        tournament: record.tournament,
        matchUrl: record.matchUrl,
        riskyTeams: record.riskyTeams,
        id: record.id || timestamp.toString(),
        goalId: record.goalId,
        currency: record.currency,
        originalAmount: record.originalAmount,
        exchangeRate: record.exchangeRate,
        originalProfit: record.originalProfit,
        createdAt: record.createdAt || timestamp,
        winProbability: record.winProbability
      };
      
      const username = localStorage.getItem('username') || '';
      if (!username) {
        throw new Error('No user logged in');
      }
      const userKey = `user_${username}_mybets_data`;
      const userData = localStorage.getItem(userKey);
      const userBets: CS2BettingRecord[] = userData ? JSON.parse(userData) : [];
      userBets.push(newRecord);
      localStorage.setItem(userKey, JSON.stringify(userBets));
    } catch (error) {
      logServiceCall('RealGoogleSheets', 'addRecord');
      console.error('Error adding record:', error);
      throw error;
    }
  }

  // Update bet result — user-scoped only
  async updateBetResult(bet: Partial<CS2BettingRecord>, result: 'Win' | 'Loss', profit: number, roi: number): Promise<void> {
    try {
      const searchBet: CS2BettingRecord = {
        date: bet.date || '',
        match: bet.match || '',
        team1: bet.team1 || '',
        team2: bet.team2 || '',
        betType: bet.betType || '',
        odds: bet.odds || 0,
        amount: bet.amount || 0,
        result: bet.result || 'Pending',
        profit: bet.profit || 0,
        roi: bet.roi || 0,
        strategy: bet.strategy || '',
        notes: bet.notes || '',
        id: bet.id,
        createdAt: bet.createdAt
      };

      const username = localStorage.getItem('username') || '';
      if (!username) {
        throw new Error('Bet not found for update — no user logged in');
      }

      const userKey = `user_${username}_mybets_data`;
      const userData = localStorage.getItem(userKey);
      if (!userData) {
        throw new Error('Bet not found for update in user storage');
      }

      const userBets: CS2BettingRecord[] = JSON.parse(userData);
      const userBetIndex = findBetIndex(userBets, searchBet);

      if (userBetIndex !== -1) {
        userBets[userBetIndex] = {
          ...userBets[userBetIndex],
          result,
          profit,
          roi,
          originalProfit: bet.originalProfit !== undefined ? bet.originalProfit : userBets[userBetIndex].originalProfit,
          goalId: userBets[userBetIndex].goalId
        };
        localStorage.setItem(userKey, JSON.stringify(userBets));
        return;
      }

      throw new Error('Bet not found for update in any storage');
    } catch (error) {
      logServiceCall('RealGoogleSheets', 'updateBetResult');
      console.error('Error updating bet result:', error);
      throw error;
    }
  }

  // Clear all betting data (user-scoped)
  async clearAllData(): Promise<void> {
    try {
      const username = localStorage.getItem('username') || '';
      if (username) {
        localStorage.removeItem(`user_${username}_mybets_data`);
      }
    } catch (error) {
      logServiceCall('RealGoogleSheets', 'clearAllData');
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Get betting statistics
  async getBettingStatistics(): Promise<{
    totalBets: number;
    winRate: number;
    totalProfit: number;
    averageROI: number;
    profitByMonth: { month: string; profit: number }[];
    profitByStrategy: { strategy: string; profit: number }[];
  }> {
    try {
      const records = await this.fetchUSDTData();
      const completedBets = records.filter(r => r.result !== 'Pending');
      
      const totalBets = records.length;
      const wins = completedBets.filter(r => r.result === 'Win').length;
      const winRate = completedBets.length > 0 ? (wins / completedBets.length) * 100 : 0;
      const totalProfit = completedBets.reduce((sum, r) => sum + (r.profit || 0), 0);
      const averageROI = completedBets.length > 0 ? 
        completedBets.reduce((sum, r) => sum + (r.roi || 0), 0) / completedBets.length : 0;

      // Mock data for charts (replace with real calculations)
      const profitByMonth = [
        { month: 'Вересень', profit: 150 },
        { month: 'Жовтень', profit: totalProfit }
      ];

      const profitByStrategy = [
        { strategy: 'Основна стратегія', profit: totalProfit * 0.7 },
        { strategy: 'Андердоги', profit: totalProfit * 0.2 },
        { strategy: 'Тотали', profit: totalProfit * 0.1 }
      ];

      return {
        totalBets,
        winRate: Math.round(winRate),
        totalProfit: Math.round(totalProfit * 100) / 100,
        averageROI: Math.round(averageROI * 100) / 100,
        profitByMonth,
        profitByStrategy
      };
    } catch (error) {
      logServiceCall('RealGoogleSheets', 'getBettingStatistics');
      console.error('Error calculating statistics:', error);
      return {
        totalBets: 0,
        winRate: 0,
        totalProfit: 0,
        averageROI: 0,
        profitByMonth: [],
        profitByStrategy: []
      };
    }
  }
}

export const realGoogleSheetsService = new RealGoogleSheetsService();