import { Team, Match } from '@/data/mockData';

export function calculateMatchProbability(team1: Team, team2: Team): {
  team1Probability: number;
  team2Probability: number;
  confidence: number;
} {
  // Простий алгоритм розрахунку ймовірності на основі рейтингу та форми
  const team1Rating = team1.rating;
  const team2Rating = team2.rating;
  
  // Фактор недавньої форми
  const team1FormScore = team1.recentForm.reduce((acc, result) => acc + (result === 'W' ? 1 : 0), 0) / 5;
  const team2FormScore = team2.recentForm.reduce((acc, result) => acc + (result === 'W' ? 1 : 0), 0) / 5;
  
  // Комбінований рейтинг
  const team1Score = (team1Rating * 0.7) + (team1FormScore * 0.3);
  const team2Score = (team2Rating * 0.7) + (team2FormScore * 0.3);
  
  const totalScore = team1Score + team2Score;
  const team1Probability = (team1Score / totalScore) * 100;
  const team2Probability = (team2Score / totalScore) * 100;
  
  // Впевненість базується на різниці між командами
  const difference = Math.abs(team1Score - team2Score);
  const confidence = Math.min(95, Math.max(50, difference * 100));
  
  return {
    team1Probability: Math.round(team1Probability),
    team2Probability: Math.round(team2Probability),
    confidence: Math.round(confidence)
  };
}

export function getBettingRecommendation(
  probability: number,
  odds: number,
  confidence: number
): 'safe' | 'risky' | 'avoid' {
  const expectedValue = (probability / 100) * odds - 1;
  
  if (expectedValue > 0.1 && confidence > 70) return 'safe';
  if (expectedValue > 0.05 && confidence > 60) return 'risky';
  return 'avoid';
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case 'safe': return 'text-green-600 bg-green-50';
    case 'risky': return 'text-yellow-600 bg-yellow-50';
    case 'avoid': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function getRecommendationText(recommendation: string): string {
  switch (recommendation) {
    case 'safe': return 'Безпечна ставка';
    case 'risky': return 'Ризикована ставка';
    case 'avoid': return 'Уникати';
    default: return 'Невідомо';
  }
}