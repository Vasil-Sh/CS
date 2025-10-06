export interface BettingRecord {
  date: string;
  matchLink: string;
  match: string;
  risk: string;
  strategyCompliance: string;
  betType: string;
  reason: string;
  odds: number;
  myProbability: number;
  value: number;
  amount: number;
  result: string;
  profit: number;
  roi: number;
  balance: number;
  riskyTeam: string;
}

class GoogleSheetsService {
  private spreadsheetId: string = '';
  private apiKey: string = '';

  setConfig(spreadsheetId: string, apiKey: string) {
    this.spreadsheetId = spreadsheetId;
    this.apiKey = apiKey;
  }

  // Fetch betting records from localStorage (mock Google Sheets for demo)
  async fetchBettingRecords(): Promise<BettingRecord[]> {
    try {
      // For demo purposes, use localStorage to simulate Google Sheets data
      const storedData = localStorage.getItem('bettingRecords');
      if (storedData) {
        return JSON.parse(storedData);
      }

      // Default mock data if no stored data
      const mockData: BettingRecord[] = [
        {
          date: '2024-10-01',
          matchLink: 'https://hltv.org/match/1',
          match: 'NAVI vs G2',
          risk: 'Низький',
          strategyCompliance: 'Так',
          betType: 'Переможець матчу',
          reason: 'Сильна форма NAVI, хороші результати на останніх турнірах',
          odds: 1.65,
          myProbability: 70,
          value: 15.5,
          amount: 100,
          result: 'Виграш',
          profit: 65,
          roi: 65,
          balance: 1165,
          riskyTeam: 'Немає'
        },
        {
          date: '2024-10-02',
          matchLink: 'https://hltv.org/match/2',
          match: 'FaZe vs Astralis',
          risk: 'Середній',
          strategyCompliance: 'Так',
          betType: 'Переможець матчу',
          reason: 'FaZe показує стабільну гру, Astralis в кризі',
          odds: 1.45,
          myProbability: 75,
          value: 8.75,
          amount: 150,
          result: 'Виграш',
          profit: 67.5,
          roi: 45,
          balance: 1232.5,
          riskyTeam: 'Немає'
        },
        {
          date: '2024-10-03',
          matchLink: 'https://hltv.org/match/3',
          match: 'G2 vs Vitality',
          risk: 'Високий',
          strategyCompliance: 'Ні',
          betType: 'Переможець матчу',
          reason: 'Експериментальна ставка на андердога',
          odds: 2.20,
          myProbability: 40,
          value: -12,
          amount: 80,
          result: 'Програш',
          profit: -80,
          roi: -100,
          balance: 1152.5,
          riskyTeam: 'G2'
        },
        {
          date: '2024-10-04',
          matchLink: 'https://hltv.org/match/4',
          match: 'Liquid vs NIP',
          risk: 'Низький',
          strategyCompliance: 'Так',
          betType: 'Тотал карт',
          reason: 'Обидві команди грають довго, очікую 3 карти',
          odds: 1.85,
          myProbability: 65,
          value: 10.25,
          amount: 120,
          result: 'Виграш',
          profit: 102,
          roi: 85,
          balance: 1254.5,
          riskyTeam: 'Немає'
        }
      ];
      
      // Store mock data in localStorage
      localStorage.setItem('bettingRecords', JSON.stringify(mockData));
      return mockData;
    } catch (error) {
      console.error('Error fetching betting records:', error);
      return [];
    }
  }

  // Add new betting record to localStorage (simulate Google Sheets)
  async addBettingRecord(record: Omit<BettingRecord, 'profit' | 'roi' | 'balance'>): Promise<void> {
    try {
      const existingRecords = await this.fetchBettingRecords();
      
      // Calculate derived values
      const profit = record.result === 'Виграш' ? (record.odds - 1) * record.amount : 
                    record.result === 'Програш' ? -record.amount : 0;
      const roi = record.amount > 0 ? (profit / record.amount) * 100 : 0;
      
      // Calculate new balance
      const lastBalance = existingRecords.length > 0 ? existingRecords[existingRecords.length - 1].balance : 1000;
      const newBalance = lastBalance + profit;
      
      const newRecord: BettingRecord = {
        ...record,
        profit: Math.round(profit * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        balance: Math.round(newBalance * 100) / 100
      };
      
      const updatedRecords = [...existingRecords, newRecord];
      localStorage.setItem('bettingRecords', JSON.stringify(updatedRecords));
      
      console.log('Record added successfully:', newRecord);
    } catch (error) {
      console.error('Error adding betting record:', error);
      throw error;
    }
  }

  // Update existing betting record (e.g., when match result is known)
  async updateBettingRecord(index: number, updates: Partial<BettingRecord>): Promise<void> {
    try {
      const records = await this.fetchBettingRecords();
      if (index >= 0 && index < records.length) {
        records[index] = { ...records[index], ...updates };
        
        // Recalculate profit, ROI, and balance for this and subsequent records
        for (let i = index; i < records.length; i++) {
          const record = records[i];
          const profit = record.result === 'Виграш' ? (record.odds - 1) * record.amount : 
                        record.result === 'Програш' ? -record.amount : 0;
          const roi = record.amount > 0 ? (profit / record.amount) * 100 : 0;
          
          record.profit = Math.round(profit * 100) / 100;
          record.roi = Math.round(roi * 100) / 100;
          
          if (i === 0) {
            record.balance = 1000 + profit;
          } else {
            record.balance = records[i - 1].balance + profit;
          }
          record.balance = Math.round(record.balance * 100) / 100;
        }
        
        localStorage.setItem('bettingRecords', JSON.stringify(records));
      }
    } catch (error) {
      console.error('Error updating betting record:', error);
      throw error;
    }
  }

  // Get betting statistics
  async getBettingStats(): Promise<{
    totalBets: number;
    winRate: number;
    totalProfit: number;
    averageROI: number;
    currentBalance: number;
  }> {
    const records = await this.fetchBettingRecords();
    
    const totalBets = records.length;
    const completedBets = records.filter(r => r.result !== 'Очікується');
    const wins = completedBets.filter(r => r.result === 'Виграш').length;
    const winRate = completedBets.length > 0 ? (wins / completedBets.length) * 100 : 0;
    const totalProfit = records.reduce((sum, r) => sum + r.profit, 0);
    const averageROI = completedBets.length > 0 ? 
      completedBets.reduce((sum, r) => sum + r.roi, 0) / completedBets.length : 0;
    const currentBalance = records.length > 0 ? records[records.length - 1].balance : 1000;

    return {
      totalBets,
      winRate: Math.round(winRate),
      totalProfit: Math.round(totalProfit * 100) / 100,
      averageROI: Math.round(averageROI * 100) / 100,
      currentBalance: Math.round(currentBalance * 100) / 100
    };
  }

  // Clear all data (for testing)
  async clearAllData(): Promise<void> {
    localStorage.removeItem('bettingRecords');
  }
}

export const googleSheetsService = new GoogleSheetsService();