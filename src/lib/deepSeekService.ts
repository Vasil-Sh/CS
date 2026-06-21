import {
  type MatchData,
  type AIRecommendation,
  buildPrompt,
  parseAIResponse,
  getMockRecommendation,
} from './ai/shared';

class DeepSeekService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.deepseek.com/v1';
  private model = 'deepseek-chat';

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

    if (this.apiKey && this.apiKey.trim() !== '' && this.apiKey !== 'your_deepseek_api_key_here') {
      // DeepSeek API ready
    } else {
      console.warn('⚠️ DeepSeek API key not configured properly');
    }
  }

  async getMatchRecommendation(matchData: MatchData): Promise<AIRecommendation> {
    if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
      return getMockRecommendation(matchData, 'DeepSeek');
    }

    try {
      const prompt = buildPrompt(matchData);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'Ти експерт з аналізу матчів CS2 та Dota 2. Відповідай українською мовою.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DeepSeek API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const text: string | undefined = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('No response from API');
      }

      return parseAIResponse(text);
    } catch (error) {
      console.error('❌ DeepSeek API error:', error);
      return getMockRecommendation(matchData, 'DeepSeek');
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
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  
  const stateLabels: Record<string, string> = {
    growing: 'зростає (≥98% від максимуму)',
    stable: 'стабільний (85-98% від максимуму)',
    dipping: 'просідає (50-85% від максимуму)',
    falling: 'сильно падає (<50% від максимуму)',
  };

  const prompt = `Проаналізуй стан банку гравця в беттінгу (CS2/Dota 2) і дай КОРОТКУ пораду (1-2 речення) українською:
- Поточний банк: ${data.currentBank.toFixed(0)} ₴
- Максимальний банк: ${data.allTimeHigh.toFixed(0)} ₴
- Стан: ${stateLabels[data.state]}
- Профіт: ${data.profit >= 0 ? '+' : ''}${data.profit.toFixed(0)} ₴
- Всього ставок: ${data.bets}

Дай практичну рекомендацію: що робити гравцю — продовжувати, зупинитись, зменшити ставки, змінити стратегію. Будь конкретним. Відповідай ТІЛЬКИ текстом поради, без "Ось порада:" чи подібних вступів.`;

  if (apiKey && apiKey !== 'your_deepseek_api_key_here') {
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Ти професійний беттінговий радник. Відповідай коротко, українською.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
      console.warn('DeepSeek API failed, using fallback advice');
    } catch (e) {
      console.warn('DeepSeek API error:', e);
    }
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
