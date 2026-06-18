import {
  type MatchData,
  type AIRecommendation,
  buildPrompt,
  parseAIResponse,
  getMockRecommendation,
} from './ai/shared';

class OpenRouterService {
  private apiKey: string | null = null;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model = 'anthropic/claude-3.5-sonnet';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    console.log('🔑 OpenRouter API Key status:', this.apiKey ? 'Present' : 'Missing');

    if (this.apiKey && this.apiKey.trim() !== '' && this.apiKey !== 'your_openrouter_api_key_here') {
      console.log('✅ OpenRouter API initialized successfully');
    } else {
      console.warn('⚠️ OpenRouter API key not configured properly');
    }
  }

  async getMatchRecommendation(matchData: MatchData): Promise<AIRecommendation> {
    if (!this.apiKey) {
      return getMockRecommendation(matchData, 'Claude 3.5 Sonnet (OpenRouter)');
    }

    try {
      console.log('📡 Calling OpenRouter API...');
      const prompt = buildPrompt(matchData);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CS2 Betting App',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenRouter API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const text: string | undefined = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('No response from API');
      }

      console.log('✅ OpenRouter API response received');
      return parseAIResponse(text);
    } catch (error) {
      console.error('❌ OpenRouter API error:', error);
      return getMockRecommendation(matchData, 'Claude 3.5 Sonnet (OpenRouter)');
    }
  }
}

export const openRouterService = new OpenRouterService();
export type { MatchData, AIRecommendation };