// ═══════════════════════════════════════════
// Bankroll Service — dual-currency (UAH + USD)
// ═══════════════════════════════════════════

import { api } from "./apiClient";
import { UserDataService } from "./userDataService";
import type { Bet } from "@/types/betting";

interface BankrollData {
  /** Total initial bank in UAH (backward compat + unified API) */
  initialBank: number;
  /** UAH-only initial bank */
  initialBankUAH: number;
  /** USD-only initial bank (stored in USD) */
  initialBankUSD: number;
  /** Exchange rate used when USD bank was set */
  exchangeRate: number;
  manualAdjustments: number;
  lastUpdated: string;
}

export interface BankrollStats {
  initialBank: number;
  currentBank: number;
  totalProfit: number;
  roi: number;
}

export interface DualBankrollStats {
  uah: BankrollStats;
  usd: BankrollStats;
}

export class BankrollService {
  private static STORAGE_KEY = "bankroll_data";

  static isInitialized(username: string): boolean {
    const data = UserDataService.getUserData<BankrollData>(
      username,
      this.STORAGE_KEY,
      null as unknown as BankrollData,
    );
    return (
      data !== null &&
      (data.initialBankUAH !== undefined || data.initialBank !== undefined)
    );
  }

  static isInitializedUSD(username: string): boolean {
    const data = UserDataService.getUserData<BankrollData>(
      username,
      this.STORAGE_KEY,
      null as unknown as BankrollData,
    );
    return (
      data !== null &&
      data.initialBankUSD !== undefined &&
      data.initialBankUSD > 0
    );
  }

  static async setInitialBank(
    username: string,
    amount: number,
    currency: "UAH" | "USD" = "UAH",
    exchangeRate: number = 0,
  ): Promise<void> {
    const existing = UserDataService.getUserData<BankrollData>(
      username,
      this.STORAGE_KEY,
      null as unknown as BankrollData,
    ) || {
      initialBank: 0,
      initialBankUAH: 0,
      initialBankUSD: 0,
      exchangeRate: 0,
      manualAdjustments: 0,
      lastUpdated: "",
    };
    const data: BankrollData = {
      initialBank:
        currency === "UAH"
          ? amount + (existing.initialBankUSD * existing.exchangeRate || 0)
          : (existing.initialBankUAH || 0) + amount * (exchangeRate || 41.5),
      initialBankUAH:
        currency === "UAH" ? amount : existing.initialBankUAH || 0,
      initialBankUSD:
        currency === "USD" ? amount : existing.initialBankUSD || 0,
      exchangeRate:
        currency === "USD" && exchangeRate > 0
          ? exchangeRate
          : existing.exchangeRate || 0,
      manualAdjustments: 0,
      lastUpdated: new Date().toISOString(),
    };
    try {
      await api.post("/bankroll", {
        initialBank: data.initialBank,
        initialBankUSD: data.initialBankUSD,
        exchangeRate: data.exchangeRate,
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[API sync] failed:", String(err));
    }
    UserDataService.setUserDataSync(username, this.STORAGE_KEY, data);
  }

  static getBankrollData(username: string): BankrollData | null {
    const data = UserDataService.getUserData<BankrollData>(
      username,
      this.STORAGE_KEY,
      null as unknown as BankrollData,
    );
    if (!data) return null;
    // Migrate old format (only initialBank, no split)
    if (data.initialBankUAH === undefined) {
      data.initialBankUAH = data.initialBank || 0;
      data.initialBankUSD = 0;
      data.exchangeRate = 0;
    }
    return data;
  }

  static calculateTotalProfit(bets: Bet[], currency?: "UAH" | "USD"): number {
    const filtered = currency
      ? bets.filter(
          (b) => b.currency === currency || (!b.currency && currency === "UAH"),
        )
      : bets;
    return filtered
      .filter((bet) => bet.result !== "Pending")
      .reduce((sum, bet) => sum + (bet.profit || 0), 0);
  }

  static calculateTotalProfitUSD(bets: Bet[]): number {
    return bets
      .filter(
        (b) =>
          (b.currency === "USD" ||
            (!!b.exchangeRate && Number(b.exchangeRate) > 0)) &&
          b.result !== "Pending",
      )
      .reduce((sum, bet) => {
        const profit = bet.profit || 0;
        const rate = bet.exchangeRate ? Number(bet.exchangeRate) : 41.5;
        return sum + (rate > 0 ? profit / rate : 0);
      }, 0);
  }

  static getBankrollStats(username: string, bets: Bet[]): BankrollStats {
    const data = this.getBankrollData(username);
    const totalProfit = this.calculateTotalProfit(bets);

    if (!data) {
      const totalStakes = bets.reduce((sum, b) => sum + (b.amount || 0), 0);
      return { initialBank: totalStakes, currentBank: totalStakes + totalProfit, totalProfit, roi: totalStakes > 0 ? (totalProfit / totalStakes) * 100 : 0 };
    }
    const currentBank =
      (data.initialBankUAH || 0) + totalProfit + data.manualAdjustments;
    const roi =
      data.initialBankUAH > 0 ? (totalProfit / data.initialBankUAH) * 100 : 0;
    return {
      initialBank: data.initialBankUAH || 0,
      currentBank,
      totalProfit,
      roi,
    };
  }

  static getBankrollStatsDual(
    username: string,
    bets: Bet[],
  ): DualBankrollStats {
    const data = this.getBankrollData(username);
    const profitUAH = this.calculateTotalProfit(bets, "UAH");
    const profitUSD = this.calculateTotalProfitUSD(bets);

    if (!data) {
      // No bankroll data — derive from bets: sum of all stakes as implied bank
      const totalStakesUAH = bets
        .filter(b => !b.currency || b.currency !== 'USD')
        .reduce((sum, b) => sum + (b.amount || 0), 0);
      const totalStakesUSD = bets
        .filter(b => b.currency === 'USD')
        .reduce((sum, b) => sum + (b.amount || 0), 0);
      return {
        uah: { initialBank: totalStakesUAH, currentBank: totalStakesUAH + profitUAH, totalProfit: profitUAH, roi: totalStakesUAH > 0 ? (profitUAH / totalStakesUAH) * 100 : 0 },
        usd: { initialBank: totalStakesUSD, currentBank: totalStakesUSD + profitUSD, totalProfit: profitUSD, roi: totalStakesUSD > 0 ? (profitUSD / totalStakesUSD) * 100 : 0 },
      };
    }

    const currentUAH =
      (data.initialBankUAH || 0) + profitUAH + data.manualAdjustments;
    const roiUAH =
      data.initialBankUAH > 0 ? (profitUAH / data.initialBankUAH) * 100 : 0;

    const currentUSD = (data.initialBankUSD || 0) + profitUSD;
    const roiUSD =
      data.initialBankUSD > 0 ? (profitUSD / data.initialBankUSD) * 100 : 0;

    return {
      uah: {
        initialBank: data.initialBankUAH || 0,
        currentBank: currentUAH,
        totalProfit: profitUAH,
        roi: roiUAH,
      },
      usd: {
        initialBank: data.initialBankUSD || 0,
        currentBank: currentUSD,
        totalProfit: profitUSD,
        roi: roiUSD,
      },
    };
  }

  static addManualAdjustment(username: string, amount: number): void {
    const data = this.getBankrollData(username);
    if (!data) return;
    data.manualAdjustments += amount;
    data.lastUpdated = new Date().toISOString();
    UserDataService.setUserData(username, this.STORAGE_KEY, data);
    api.post("/bankroll/adjust", { amount }).catch((err: unknown) => {
      if (import.meta.env.DEV) console.warn("[API sync] failed:", String(err));
    });
  }

  static async updateInitialBank(
    username: string,
    newAmount: number,
  ): Promise<void> {
    try {
      await api.post("/bankroll", { initialBank: newAmount });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[API sync] failed:", String(err));
    }
    const data = this.getBankrollData(username);
    if (!data) return;
    data.initialBank = newAmount;
    data.initialBankUAH = newAmount;
    data.initialBankUSD = 0;
    data.exchangeRate = 0;
    data.manualAdjustments = 0;
    data.lastUpdated = new Date().toISOString();
    UserDataService.setUserDataSync(username, this.STORAGE_KEY, data);
  }

  static validateBetAmount(
    username: string,
    bets: Bet[],
    betAmount: number,
    currency: "UAH" | "USD" = "UAH",
  ): {
    isValid: boolean;
    warning?: string;
  } {
    if (currency === "USD") {
      if (!this.isInitializedUSD(username)) return { isValid: true };
      const dual = this.getBankrollStatsDual(username, bets);
      if (betAmount > dual.usd.currentBank) {
        return {
          isValid: false,
          warning: "Ставка перевищує поточний банк (USD)",
        };
      }
      return { isValid: true };
    }
    const stats = this.getBankrollStats(username, bets);
    if (!this.isInitialized(username)) return { isValid: true };
    if (betAmount > stats.currentBank) {
      return { isValid: false, warning: "Ставка перевищує поточний банк" };
    }
    return { isValid: true };
  }

  // ═══ API-backed methods ═══
  static async fetchBankroll(): Promise<
    BankrollStats & { initialBankUSD?: number; exchangeRate?: number }
  > {
    const data = await api.get<Record<string, number>>("/bankroll");
    return {
      initialBank: data.initialBank || 0,
      currentBank: data.currentBank || 0,
      totalProfit: data.totalProfit || 0,
      roi: data.roi || 0,
      initialBankUSD: data.initialBankUSD || 0,
      exchangeRate: data.exchangeRate || 0,
    };
  }

  /** Sync API bankroll data into localStorage (called when API returns successfully) */
  static syncFromAPI(
    username: string,
    apiData: {
      initialBank?: number;
      initialBankUSD?: number;
      exchangeRate?: number;
    },
  ): void {
    if (
      apiData.initialBankUSD === undefined &&
      apiData.exchangeRate === undefined
    )
      return;
    const existing = this.getBankrollData(username);
    if (!existing) return;
    if (apiData.initialBankUSD !== undefined)
      existing.initialBankUSD = apiData.initialBankUSD;
    if (apiData.exchangeRate !== undefined)
      existing.exchangeRate = apiData.exchangeRate;
    UserDataService.setUserDataSync(username, this.STORAGE_KEY, existing);
  }

  static async setInitialBankApi(
    amount: number,
  ): Promise<Record<string, unknown>> {
    return api.post("/bankroll", { initialBank: amount });
  }

  static async adjustBankroll(
    amount: number,
  ): Promise<Record<string, unknown>> {
    return api.post("/bankroll/adjust", { amount });
  }
}
