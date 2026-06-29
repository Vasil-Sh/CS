import {
  type MatchData,
  type AIRecommendation,
  getMockRecommendation,
} from './ai/shared';
import { api } from './apiClient';

// ── AI Response Cache ──
interface CacheEntry {
  recommendation: AIRecommendation;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_VERSION = 'v2'; // bump when mock logic changes to invalidate old cached entries
const CACHE_KEY_PREFIX = `ds_cache_${CACHE_VERSION}_`;

function getCached(key: string): AIRecommendation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }
    return entry.recommendation;
  } catch {
    return null;
  }
}

function setCache(key: string, recommendation: AIRecommendation): void {
  try {
    const entry: CacheEntry = { recommendation, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage full — silently ignore
  }
}

function buildCacheKey(matchData: MatchData): string {
  return `${matchData.team1}_vs_${matchData.team2}_${matchData.format}_${matchData.tier}`;
}

class DeepSeekService {
  private pendingRequests = new Map<string, Promise<AIRecommendation>>();

  async getMatchRecommendation(matchData: MatchData): Promise<AIRecommendation> {
    const cacheKey = buildCacheKey(matchData);

    // 1. Check cache
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // 2. Deduplicate concurrent requests for same match
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) return pending;

    // 3. Create new request (proxied through backend)
    const promise = this._fetchRecommendation(matchData, cacheKey);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async _fetchRecommendation(matchData: MatchData, cacheKey: string): Promise<AIRecommendation> {
    try {
      const data = await api.post<AIRecommendation>('/ai/recommend', matchData);
      setCache(cacheKey, data);
      return data;
    } catch {
      if (import.meta.env.DEV) console.warn('Backend AI unavailable, using mock');
      const fallback = getMockRecommendation(matchData, 'DeepSeek');
      setCache(cacheKey, fallback);
      return fallback;
    }
  }
}

export const deepSeekService = new DeepSeekService();
export type { MatchData, AIRecommendation };

export interface BalanceAdvice {
  state: 'growing' | 'stable' | 'dipping' | 'falling';
  percentOfPeak: number;
  currentBank: number;
  allTimeHigh: number;
  bets: number;
  profit: number;
}

export async function getBalanceAdvice(data: BalanceAdvice): Promise<string> {
  // Try backend AI proxy first
  try {
    const result = await api.post<{ advice: string }>('/ai/advice', data);
    if (result.advice) return result.advice;
  } catch {
    // Fall back to heuristic advice below
  }

  // Fallback: heuristic advice
  const tips: Record<string, string[]> = {
    growing: [
      'Банк на піку — це чудово. Фіксуй прибуток: виведи частину коштів як резерв і продовжуй з тією ж стратегією.',
      'Ти на максимумі. Раджу зняти 20-30% прибутку як подушку безпеки, а рештою продовжуй грати обережно.',
    ],
    stable: [
      'Банк стабільний — хороший знак. Продовжуй дотримуватися стратегії, але уникай імпульсивних ставок на високі коефіцієнти.',
      'Усе під контролем. Якщо хочеш рости — збільшуй кількість якісних ставок, а не суми.',
    ],
    dipping: [
      'Банк просідає. Зменш розмір ставок удвічі на 3-5 днів і грай тільки на коефіцієнтах 1.3-1.8, поки не повернешся до 90% від максимуму.',
      'Ризики зависокі. Зроби паузу на день-два, переглянь останні 10 програшів і знайди патерн помилок.',
    ],
    falling: [
      'Банк серйозно просів. Зупинись на тиждень. Переглянь усю стратегію: можливо ти ставиш на зависокі коефіцієнти або емоційно відіграєшся.',
      'Критичне падіння. Рекомендую припинити ставки, вивести залишок і почати з меншого банку після аналізу помилок.',
    ],
  };

  const options = tips[data.state] || tips.stable;
  return options[Math.floor(Math.random() * options.length)];
}
