// ═══════════════════════════════════════════
// Bankroll Service — localStorage + API hybrid
// ═══════════════════════════════════════════

import { api } from './apiClient';
import { UserDataService } from './userDataService';
import type { Bet } from '@/types/betting';

interface BankrollData {
  initialBank: number;
  manualAdjustments: number;
  lastUpdated: string;
}

interface BankrollStats {
  initialBank: number;
  currentBank: number;
  totalProfit: number;
  roi: number;
}

export class BankrollService {
  private static STORAGE_KEY = 'bankroll_data';

  static isInitialized(username: string): boolean {
    const data = UserDataService.getUserData(username, this.STORAGE_KEY, null);
    return data !== null && data.initialBank !== undefined;
  }

  static setInitialBank(username: string, amount: number): void {
    const data: BankrollData = {
      initialBank: amount,
      manualAdjustments: 0,
      lastUpdated: new Date().toISOString()
    };
    UserDataService.setUserDataSync(username, this.STORAGE_KEY, data);
  }

  static getBankrollData(username: string): BankrollData | null {
    return UserDataService.getUserData(username, this.STORAGE_KEY, null);
  }

  static calculateTotalProfit(bets: Bet[]): number {
    return bets
      .filter(bet => bet.result !== 'Pending')
      .reduce((sum, bet) => sum + (bet.profit || 0), 0);
  }

  static getBankrollStats(username: string, bets: Bet[]): BankrollStats {
    const data = this.getBankrollData(username);
    if (!data) {
      return { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 };
    }
    const totalProfit = this.calculateTotalProfit(bets);
    const currentBank = data.initialBank + totalProfit + data.manualAdjustments;
    const roi = data.initialBank > 0 ? (totalProfit / data.initialBank) * 100 : 0;
    return { initialBank: data.initialBank, currentBank, totalProfit, roi };
  }

  static addManualAdjustment(username: string, amount: number): void {
    const data = this.getBankrollData(username);
    if (!data) return;
    data.manualAdjustments += amount;
    data.lastUpdated = new Date().toISOString();
    UserDataService.setUserData(username, this.STORAGE_KEY, data);
  }

  static updateInitialBank(username: string, newAmount: number): void {
    const data = this.getBankrollData(username);
    if (!data) return;
    data.initialBank = newAmount;
    data.manualAdjustments = 0;
    data.lastUpdated = new Date().toISOString();
    UserDataService.setUserDataSync(username, this.STORAGE_KEY, data);
  }

  static validateBetAmount(username: string, bets: Bet[], betAmount: number): {
    isValid: boolean;
    warning?: string;
  } {
    const stats = this.getBankrollStats(username, bets);
    if (!this.isInitialized(username)) {
      return { isValid: true };
    }
    if (betAmount > stats.currentBank) {
      return { isValid: false, warning: 'Ставка перевищує поточний банк' };
    }
    return { isValid: true };
  }

  // ═══ API-backed methods ═══

  /** Fetch bankroll from API */
  static async fetchBankroll(): Promise<BankrollStats> {
    const data = await api.get<Record<string, number>>('/bankroll');
    return {
      initialBank: data.initialBank || 0,
      currentBank: data.currentBank || 0,
      totalProfit: data.totalProfit || 0,
      roi: data.roi || 0,
    };
  }

  /** Set initial bank via API */
  static async setInitialBankApi(amount: number): Promise<Record<string, unknown>> {
    return api.post('/bankroll', { initialBank: amount });
  }

  /** Add manual adjustment via API */
  static async adjustBankroll(amount: number): Promise<Record<string, unknown>> {
    return api.post('/bankroll/adjust', { amount });
  }
}
