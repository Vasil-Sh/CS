interface MatchData {
  team1: string;
  team2: string;
  format: string;
  tier: string;
  odds?: {
    team1?: number;
    team2?: number;
  };
}

interface AIRecommendation {
  prediction: string;
  confidence: number;
  reasoning: string;
  suggestedBet: string;
  riskLevel: 'low' | 'medium' | 'high';
}

class OpenRouterService {
  private apiKey: string | null = null;
  private baseUrl = 'https://openrouter.ai/api/v1';
  // Using Claude 3.5 Sonnet for best analysis quality
  private model = 'anthropic/claude-3.5-sonnet';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    console.log('🔑 OpenRouter API Key status:', this.apiKey ? 'Present' : 'Missing');
    console.log('🔑 API Key length:', this.apiKey?.length || 0);
    
    if (this.apiKey && this.apiKey.trim() !== '' && this.apiKey !== 'your_openrouter_api_key_here') {
      console.log('✅ OpenRouter API initialized successfully');
      console.log('🤖 Using model:', this.model);
    } else {
      console.warn('⚠️ OpenRouter API key not configured properly');
    }
  }

  async getMatchRecommendation(matchData: MatchData): Promise<AIRecommendation> {
    console.log('🤖 Getting match recommendation for:', matchData.team1, 'vs', matchData.team2);
    console.log('🤖 API status:', this.apiKey ? 'Available' : 'Not available');
    
    if (!this.apiKey) {
      console.warn('⚠️ Using mock recommendation - API not initialized');
      return this.getMockRecommendation(matchData);
    }

    try {
      console.log('📡 Calling OpenRouter API...');
      const prompt = this.buildPrompt(matchData);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CS2 Betting App'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenRouter API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      
      if (!text) {
        throw new Error('No response from API');
      }
      
      console.log('✅ OpenRouter API response received');
      console.log('📝 Response text:', text.substring(0, 200) + '...');
      
      return this.parseAIResponse(text);
    } catch (error) {
      console.error('❌ OpenRouter API error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return this.getMockRecommendation(matchData);
    }
  }

  private buildPrompt(matchData: MatchData): string {
    const { team1, team2, format, tier, odds } = matchData;
    
    let prompt = `Ти експерт з аналізу матчів CS2 (Counter-Strike 2). Проаналізуй наступний матч і дай свою рекомендацію для ставки.

Матч: ${team1} vs ${team2}
Формат: ${format}
Рівень: ${tier}`;

    if (odds?.team1 && odds?.team2) {
      prompt += `\nКоефіцієнти: ${team1} - ${odds.team1}, ${team2} - ${odds.team2}`;
    }

    prompt += `

Надай відповідь у наступному форматі (СТРОГО дотримуйся цього формату):

PREDICTION: [Назва команди-фаворита або "Рівні шанси"]
CONFIDENCE: [Число від 0 до 100]
REASONING: [Детальне обґрунтування 2-3 речення про форму команд, стиль гри, історію зустрічей]
SUGGESTED_BET: [Конкретна рекомендація, наприклад "П1", "П2", "Тотал більше 2.5", "Фора команди 1"]
RISK_LEVEL: [low/medium/high]

Враховуй:
- Формат Bo1 (Best of 1) більш непередбачуваний ніж Bo3
- TIER1 команди мають стабільнішу гру
- Коефіцієнти відображають думку букмекерів
- Рекомендуй ставки з value (коли коефіцієнт вищий за реальну ймовірність)`;

    return prompt;
  }

  private parseAIResponse(text: string): AIRecommendation {
    try {
      const lines = text.split('\n');
      const data: Partial<{
        prediction: string;
        confidence: number;
        reasoning: string;
        suggestedBet: string;
        riskLevel: 'low' | 'medium' | 'high';
      }> = {};

      for (const line of lines) {
        if (line.includes('PREDICTION:')) {
          data.prediction = line.split('PREDICTION:')[1].trim();
        } else if (line.includes('CONFIDENCE:')) {
          const conf = line.split('CONFIDENCE:')[1].trim();
          data.confidence = parseInt(conf.replace(/\D/g, ''));
        } else if (line.includes('REASONING:')) {
          data.reasoning = line.split('REASONING:')[1].trim();
        } else if (line.includes('SUGGESTED_BET:')) {
          data.suggestedBet = line.split('SUGGESTED_BET:')[1].trim();
        } else if (line.includes('RISK_LEVEL:')) {
          const risk = line.split('RISK_LEVEL:')[1].trim().toLowerCase();
          data.riskLevel = risk.includes('low') ? 'low' : risk.includes('high') ? 'high' : 'medium';
        }
      }

      // Collect reasoning if it spans multiple lines
      const reasoningIndex = text.indexOf('REASONING:');
      const suggestedBetIndex = text.indexOf('SUGGESTED_BET:');
      if (reasoningIndex !== -1 && suggestedBetIndex !== -1) {
        data.reasoning = text.substring(reasoningIndex + 10, suggestedBetIndex).trim();
      }

      return {
        prediction: data.prediction || 'Немає прогнозу',
        confidence: data.confidence || 50,
        reasoning: data.reasoning || 'Аналіз недоступний',
        suggestedBet: data.suggestedBet || 'Немає рекомендації',
        riskLevel: data.riskLevel || 'medium'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        prediction: 'Помилка аналізу',
        confidence: 0,
        reasoning: 'Не вдалося обробити відповідь AI',
        suggestedBet: 'Немає рекомендації',
        riskLevel: 'high'
      };
    }
  }

  private getMockRecommendation(matchData: MatchData): AIRecommendation {
    const { team1, team2, format, tier } = matchData;
    
    return {
      prediction: team1,
      confidence: 65,
      reasoning: `Аналіз матчу ${team1} vs ${team2} (${format}, ${tier}). Для отримання реальних AI рекомендацій від Claude 3.5 Sonnet через OpenRouter, будь ласка, перевірте API ключ.`,
      suggestedBet: 'П1',
      riskLevel: 'medium'
    };
  }
}

export const openRouterService = new OpenRouterService();
export type { MatchData, AIRecommendation };