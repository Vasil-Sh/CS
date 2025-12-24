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
}

export interface CS2Strategy {
  name: string;
  description: string;
  criteria: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedROI: number;
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
        criteria: [
          'Аналіз форми команд',
          'Статистика head-to-head',
          'Карти в пулі',
          'Мотивація команд'
        ],
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
    return [
      {
        name: 'Блок 1: Основна стратегія',
        description: 'Базова стратегія для ставок на CS2 матчі з фокусом на аналіз форми команд та статистики',
        criteria: [
          'Аналіз останніх 10 матчів команд',
          'Статистика head-to-head зустрічей',
          'Перевага на конкретних картах',
          'Мотивація та важливість матчу',
          'Стан складу (заміни, травми)'
        ],
        riskLevel: 'Medium',
        expectedROI: 15
      },
      {
        name: 'Стратегія андердогів',
        description: 'Ставки на команди з високими коефіцієнтами при певних умовах',
        criteria: [
          'Коефіцієнт вище 2.5',
          'Команда показала зростання форми',
          'Фаворит в кризі або має проблеми',
          'Карти підходять андердогу'
        ],
        riskLevel: 'High',
        expectedROI: 25
      },
      {
        name: 'Тотали та фори',
        description: 'Консервативна стратегія на тотали карт та фори',
        criteria: [
          'Стабільна статистика команд по картах',
          'Історія зустрічей команд',
          'Стиль гри команд (агресивний/оборонний)'
        ],
        riskLevel: 'Low',
        expectedROI: 8
      }
    ];
  }

  // Get strategy by name
  getStrategyByName(strategyName: string): CS2Strategy | null {
    try {
      // First check custom strategies
      const customStrategies = localStorage.getItem('customStrategies');
      if (customStrategies) {
        const strategies: CS2Strategy[] = JSON.parse(customStrategies);
        const found = strategies.find(s => s.name === strategyName);
        if (found) return found;
      }
      
      // Then check mock strategies
      const mockStrategies = this.getMockStrategyData();
      return mockStrategies.find(s => s.name === strategyName) || null;
    } catch (error) {
      console.error('Error getting strategy:', error);
      return null;
    }
  }

  // Add new record to your Google Sheets (would require write permissions)
  async addRecord(record: Partial<CS2BettingRecord>): Promise<void> {
    try {
      // For now, save to localStorage as we need write permissions for Google Sheets
      const existingData = this.getLocalStorageData('cs2_betting_records');
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
        id: Date.now().toString() // Add unique ID for updates
      };
      
      existingData.push(newRecord);
      localStorage.setItem('cs2_betting_records', JSON.stringify(existingData));
      
      console.log('Record added to localStorage:', newRecord);
    } catch (error) {
      console.error('Error adding record:', error);
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
          roi
        };
        
        localStorage.setItem('cs2_betting_records', JSON.stringify(existingData));
        console.log('Bet result updated:', existingData[betIndex]);
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