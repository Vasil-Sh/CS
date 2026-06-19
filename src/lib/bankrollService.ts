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

  /**
   * Перевірити чи встановлено початковий банк
   */
  static isInitialized(username: string): boolean {
    const data = UserDataService.getUserData(username, this.STORAGE_KEY, null);
    return data !== null && data.initialBank !== undefined;
  }

  /**
   * Встановити початковий банк (тільки один раз)
   */
  static setInitialBank(username: string, amount: number): void {
    const data: BankrollData = {
      initialBank: amount,
      manualAdjustments: 0,
      lastUpdated: new Date().toISOString()
    };
    UserDataService.setUserDataSync(username, this.STORAGE_KEY, data);
  }

  /**
   * Отримати дані банку
   */
  static getBankrollData(username: string): BankrollData | null {
    return UserDataService.getUserData(username, this.STORAGE_KEY, null);
  }

  /**
   * Розрахувати загальний профіт з закритих ставок
   */
  static calculateTotalProfit(bets: Bet[]): number {
    return bets
      .filter(bet => bet.result !== 'Pending')
      .reduce((sum, bet) => {
        // Використовуємо profit в UAH для аналітики
        return sum + (bet.profit || 0);
      }, 0);
  }

  /**
   * Отримати повну статистику банку
   */
  static getBankrollStats(username: string, bets: Bet[]): BankrollStats {
    const data = this.getBankrollData(username);
    
    if (!data) {
      return {
        initialBank: 0,
        currentBank: 0,
        totalProfit: 0,
        roi: 0
      };
    }

    const totalProfit = this.calculateTotalProfit(bets);
    const currentBank = data.initialBank + totalProfit + data.manualAdjustments;
    const roi = data.initialBank > 0 ? (totalProfit / data.initialBank) * 100 : 0;

    return {
      initialBank: data.initialBank,
      currentBank,
      totalProfit,
      roi
    };
  }

  /**
   * Додати ручну корекцію (депозит/вивід)
   * Поки не використовується, але архітектура готова
   */
  static addManualAdjustment(username: string, amount: number): void {
    const data = this.getBankrollData(username);
    if (!data) return;

    data.manualAdjustments += amount;
    data.lastUpdated = new Date().toISOString();
    UserDataService.setUserData(username, this.STORAGE_KEY, data);
  }

  /**
   * Оновити початковий банк (якщо користувач хоче змінити)
   */
  static updateInitialBank(username: string, newAmount: number): void {
    const data = this.getBankrollData(username);
    if (!data) return;

    data.initialBank = newAmount;
    data.lastUpdated = new Date().toISOString();
    UserDataService.setUserDataSync(username, this.STORAGE_KEY, data);
  }

  /**
   * Перевірити чи ставка перевищує поточний банк
   */
  static validateBetAmount(username: string, bets: Bet[], betAmount: number): {
    isValid: boolean;
    warning?: string;
  } {
    const stats = this.getBankrollStats(username, bets);
    
    if (!this.isInitialized(username)) {
      return { isValid: true };
    }

    if (betAmount > stats.currentBank) {
      return {
        isValid: true,
        warning: '⚠️ Сума ставки перевищує поточний банк'
      };
    }

    if (stats.currentBank < 0) {
      return {
        isValid: true,
        warning: '⚠️ Увага! Поточний банк від\'ємний'
      };
    }

    return { isValid: true };
  }
}