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
    console.log('🔑 DeepSeek API Key status:', this.apiKey ? 'Present' : 'Missing');

    if (this.apiKey && this.apiKey.trim() !== '' && this.apiKey !== 'your_deepseek_api_key_here') {
      console.log('✅ DeepSeek API initialized successfully');
    } else {
      console.warn('⚠️ DeepSeek API key not configured properly');
    }
  }

  async getMatchRecommendation(matchData: MatchData): Promise<AIRecommendation> {
    if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
      return getMockRecommendation(matchData, 'DeepSeek');
    }

    try {
      console.log('📡 Calling DeepSeek API...');
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

      console.log('✅ DeepSeek API response received');
      return parseAIResponse(text);
    } catch (error) {
      console.error('❌ DeepSeek API error:', error);
      return getMockRecommendation(matchData, 'DeepSeek');
    }
  }
}

export const deepSeekService = new DeepSeekService();
export type { MatchData, AIRecommendation };
