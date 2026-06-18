import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  type MatchData,
  type AIRecommendation,
  buildPrompt,
  parseAIResponse,
  getMockRecommendation,
} from './ai/shared';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('🔑 Gemini API Key status:', apiKey ? 'Present' : 'Missing');

    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        console.log('✅ Gemini API initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini API:', error);
      }
    } else {
      console.warn('⚠️ Gemini API key not configured properly');
    }
  }

  async getMatchRecommendation(matchData: MatchData): Promise<AIRecommendation> {
    if (!this.model) {
      return getMockRecommendation(matchData, 'Google Gemini');
    }

    try {
      const prompt = buildPrompt(matchData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Gemini API response received');
      return parseAIResponse(text);
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      return getMockRecommendation(matchData, 'Google Gemini');
    }
  }
}

export const geminiService = new GeminiService();
export type { MatchData, AIRecommendation };