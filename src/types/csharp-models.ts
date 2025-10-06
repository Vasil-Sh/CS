// TypeScript interfaces matching C# models from SC project

export interface CSharpGame {
  id?: number;
  date?: string;
  dateText?: string;
  link: string;
  type: string;
  score1: number;
  score2: number;
  stars: number;
  team1: string;
  team2: string;
}

export interface CSharpTeam {
  id?: number;
  position: number;
  name: string;
  points: number;
  hltvId: number;
  nameForUrl: string;
}

export interface CSharpGameDetail {
  id: number;
  link: string;
  gameNumber: number;
  mapName: string;
  
  // Player 1 (Team 1)
  player1Name: string;
  player1Lost: boolean;
  player1Pick: boolean;
  player1Score: number;
  player1Won: boolean;
  player1Score1: number;
  player1Side1: string;
  player1Score2: number;
  player1Side2: string;
  player1Score3: number;
  player1Side3: string;
  
  // Player 2 (Team 2)
  player2Name: string;
  player2Lost: boolean;
  player2Pick: boolean;
  player2Score: number;
  player2Won: boolean;
  player2Score1: number;
  player2Side1: string;
  player2Score2: number;
  player2Side2: string;
  player2Score3: number;
  player2Side3: string;
}

export interface CSharpMap {
  id?: number;
  name: string;
  imageUrl?: string;
}

export interface CSharpPlayersData {
  id?: number;
  teamName: string;
  playerName: string;
  rating: number;
  kills: number;
  deaths: number;
  assists: number;
  kdr: number;
  adr: number;
}

// Bridge response types
export interface CSharpBridgeResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Mapping functions to convert C# models to existing React types
export const mapCSharpGameToBet = (game: CSharpGame): Record<string, unknown> => ({
  id: game.id?.toString() || Math.random().toString(),
  date: game.date || new Date().toISOString(),
  team1: game.team1,
  team2: game.team2,
  bet: game.score1 > game.score2 ? game.team1 : game.team2,
  odds: game.stars * 1.2, // Convert stars to approximate odds
  stake: 100, // Default stake
  result: game.score1 > game.score2 ? 'win' : 'loss',
  profit: game.score1 > game.score2 ? game.stars * 20 : -100,
  matchScore: `${game.score1}-${game.score2}`,
  tournament: game.type,
  confidence: game.stars * 20, // Convert stars to confidence %
  notes: `HLTV Link: ${game.link}`
});

export const mapCSharpTeamToTeam = (team: CSharpTeam): Record<string, unknown> => ({
  name: team.name,
  rank: team.position,
  rating: team.points,
  hltvId: team.hltvId,
  recentForm: 'Unknown',
  mapPool: [],
  tier: team.position <= 10 ? 'S' : team.position <= 30 ? 'A' : 'B'
});