// Real Google Sheets integration for CS2 Analytics
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

class RealGoogleSheetsService {
  private spreadsheetId: string = '1WPchid4Di6XjUehfX1gnBinknUBiqiirSs16Vbn7rvw';
  private apiKey: string = '';

  // Set API key for Google Sheets access
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Fetch data from your Google Sheets (USDT tab)
  async fetchUSDTData(): Promise<CS2BettingRecord[]> {
    try {
      if (!this.apiKey) {
        console.warn('Google Sheets API key not set, using localStorage data');
        return this.getLocalStorageData('cs2_betting_records') || [];
      }

      const range = 'USDT!A:Z'; // Adjust range as needed
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data: GoogleSheetsResponse = await response.json();
      
      if (data.values) {
        // Process the raw data from your sheets
        return this.processSheetData(data.values);
      }
      
      return this.getLocalStorageData('cs2_betting_records') || [];
    } catch (error) {
      console.error('Error fetching USDT data:', error);
      return this.getLocalStorageData('cs2_betting_records') || [];
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
      console.error('Error fetching strategy data:', error);
      return this.getMockStrategyData();
    }
  }

  // Process raw sheet data into structured format
  private processSheetData(rawData: string[][]): CS2BettingRecord[] {
    if (rawData.length < 2) return [];
    
    const headers = rawData[0];
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

  // Get data from localStorage as fallback
  private getLocalStorageData(key: string): CS2BettingRecord[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Mock strategy data for demo
  private getMockStrategyData(): CS2Strategy[] {
    return [];
  }

  // Get strategy by name
  getStrategyByName(strategyName: string): CS2Strategy | null {
    try {
      // Check custom strategies from localStorage
      const customStrategies = localStorage.getItem('customStrategies');
      if (customStrategies) {
        const strategies: CS2Strategy[] = JSON.parse(customStrategies);
        const found = strategies.find(s => s.name === strategyName);
        if (found) return found;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting strategy:', error);
      return null;
    }
  }

  // Get all records (синхронний метод для сумісності)
  getAllRecords(): CS2BettingRecord[] {
    try {
      // Спочатку перевіряємо user-specific дані
      const currentUser = localStorage.getItem('currentUser') || '';
      if (currentUser) {
        const userKey = `user_${currentUser}_mybets_data`;
        const userData = localStorage.getItem(userKey);
        if (userData) {
          const userBets = JSON.parse(userData);
          if (userBets.length > 0) {
            console.log('✅ getAllRecords: loaded from user-specific storage:', userBets.length);
            return userBets;
          }
        }
      }
      
      // Fallback до загального сховища
      const records = this.getLocalStorageData('cs2_betting_records');
      console.log('✅ getAllRecords: loaded from general storage:', records.length);
      return records;
    } catch (error) {
      console.error('❌ Error in getAllRecords:', error);
      return [];
    }
  }

  // ОНОВЛЕНО: Add new record with timestamp
  async addRecord(record: Partial<CS2BettingRecord>): Promise<void> {
    try {
      console.log('📝 addRecord called with:', record);
      
      // For now, save to localStorage as we need write permissions for Google Sheets
      const existingData = this.getLocalStorageData('cs2_betting_records');
      
      // ДОДАНО: timestamp для точного сортування
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
        tournament: record.tournament,
        matchUrl: record.matchUrl,
        id: timestamp.toString(),
        goalId: record.goalId,
        currency: record.currency,
        originalAmount: record.originalAmount,
        exchangeRate: record.exchangeRate,
        originalProfit: record.originalProfit,
        createdAt: timestamp // ДОДАНО: зберігаємо точний час створення
      };
      
      console.log('💾 Saving record with timestamp:', newRecord.createdAt);
      
      existingData.push(newRecord);
      localStorage.setItem('cs2_betting_records', JSON.stringify(existingData));
      
      // Також зберігаємо в user-specific ключ для синхронізації
      const currentUser = localStorage.getItem('currentUser') || '';
      if (currentUser) {
        const userKey = `user_${currentUser}_mybets_data`;
        const userData = localStorage.getItem(userKey);
        const userBets = userData ? JSON.parse(userData) : [];
        userBets.push(newRecord);
        localStorage.setItem(userKey, JSON.stringify(userBets));
        console.log('✅ Also saved to user-specific key:', userKey);
      }
      
      console.log('✅ Record added to localStorage:', newRecord);
    } catch (error) {
      console.error('❌ Error adding record:', error);
      throw error;
    }
  }

  // Update bet result
  async updateBetResult(bet: CS2BettingRecord, result: 'Win' | 'Loss', profit: number, roi: number): Promise<void> {
    try {
      const existingData = this.getLocalStorageData('cs2_betting_records');
      
      // Find the bet to update (match by multiple fields since we don't have unique IDs)
      const betIndex = existingData.findIndex((record: CS2BettingRecord) => 
        record.date === bet.date &&
        record.match === bet.match &&
        record.amount === bet.amount &&
        record.odds === bet.odds
      );
      
      if (betIndex !== -1) {
        existingData[betIndex] = {
          ...existingData[betIndex],
          result,
          profit,
          roi,
          goalId: existingData[betIndex].goalId
        };
        
        localStorage.setItem('cs2_betting_records', JSON.stringify(existingData));
        console.log('✅ Bet result updated with goalId preserved:', existingData[betIndex]);
      } else {
        throw new Error('Bet not found for update');
      }
    } catch (error) {
      console.error('Error updating bet result:', error);
      throw error;
    }
  }

  // Clear all betting data
  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem('cs2_betting_records');
      console.log('All betting data cleared from localStorage');
    } catch (error) {
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