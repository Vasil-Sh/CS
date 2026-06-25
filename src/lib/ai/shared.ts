/**
 * Shared AI service types, prompt builder, and response parser.
 * Used by both GeminiService and OpenRouterService to avoid code duplication.
 */

export interface MatchData {
  team1: string;
  team2: string;
  format: string;
  tier: string;
  odds?: {
    team1?: number;
    team2?: number;
  };
}

export interface AIRecommendation {
  prediction: string;
  confidence: number;
  reasoning: string;
  suggestedBet: string;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Builds the analysis prompt for an AI model.
 * Both Gemini and OpenRouter use the same prompt template.
 */
export function buildPrompt(matchData: MatchData): string {
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

/**
 * Parses the AI model response text into a structured AIRecommendation.
 */
export function parseAIResponse(text: string): AIRecommendation {
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
        data.confidence = parseInt(conf.replace(/\D/g, ''), 10);
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
      riskLevel: data.riskLevel || 'medium',
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      prediction: 'Помилка аналізу',
      confidence: 0,
      reasoning: 'Не вдалося обробити відповідь AI',
      suggestedBet: 'Немає рекомендації',
      riskLevel: 'high',
    };
  }
}

/**
 * Returns a mock recommendation when the AI API is unavailable.
 */
export function getMockRecommendation(matchData: MatchData, providerName: string): AIRecommendation {
  const { team1, team2, format, tier } = matchData;

  // Generate varied confidence (55-78%) based on match characteristics
  const hash = `${team1}${team2}${format}`.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const confidence = 55 + (hash % 24); // 55-78 range

  const suggestions = ['П1', 'П2', 'Тотал більше 2.5', 'Фора +1.5'];
  const suggestion = suggestions[hash % suggestions.length];

  const reasons = [
    `${team1} показує кращу форму в останніх матчах.`,
    `${team2} має слабшу статистику на цій карті.`,
    `Рівень команд близький, але ${team1} має перевагу в досвіді.`,
    `${team2} нестабільна в Bo${format === 'BO1' ? '1' : '3'} форматі.`,
  ];
  const reason = reasons[hash % reasons.length];

  return {
    prediction: team1,
    confidence,
    reasoning: `Аналіз матчу ${team1} vs ${team2} (${format}, ${tier}). ${reason} Для отримання реальних AI рекомендацій від ${providerName}, будь ласка, перевірте API ключ.`,
    suggestedBet: suggestion,
    riskLevel: confidence > 70 ? 'low' : confidence > 60 ? 'medium' : 'high',
  };
}
