export interface Team {
  id: string;
  name: string;
  logo: string;
  rating: number;
  winRate: number;
  avgRounds: number;
  recentForm: ('W' | 'L')[];
  players: Player[];
}

export interface Player {
  id: string;
  name: string;
  rating: number;
  kd: number;
  adr: number;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  date: string;
  tournament: string;
  odds: {
    team1: number;
    team2: number;
  };
  prediction: {
    winner: string;
    confidence: number;
    recommendation: 'safe' | 'risky' | 'avoid';
  };
  status: 'upcoming' | 'live' | 'finished';
  score?: {
    team1: number;
    team2: number;
  };
}

export const mockTeams: Team[] = [
  {
    id: '1',
    name: 'NAVI',
    logo: '🟨',
    rating: 1.25,
    winRate: 78,
    avgRounds: 16.2,
    recentForm: ['W', 'W', 'L', 'W', 'W'],
    players: [
      { id: '1', name: 's1mple', rating: 1.31, kd: 1.28, adr: 84.2 },
      { id: '2', name: 'electronic', rating: 1.18, kd: 1.15, adr: 78.5 },
      { id: '3', name: 'Perfecto', rating: 1.05, kd: 1.02, adr: 71.3 },
      { id: '4', name: 'b1t', rating: 1.12, kd: 1.08, adr: 75.8 },
      { id: '5', name: 'sdy', rating: 0.98, kd: 0.95, adr: 68.9 }
    ]
  },
  {
    id: '2',
    name: 'G2 Esports',
    logo: '🔴',
    rating: 1.18,
    winRate: 72,
    avgRounds: 15.8,
    recentForm: ['W', 'L', 'W', 'W', 'L'],
    players: [
      { id: '6', name: 'NiKo', rating: 1.24, kd: 1.21, adr: 81.7 },
      { id: '7', name: 'hunter-', rating: 1.15, kd: 1.12, adr: 76.3 },
      { id: '8', name: 'jks', rating: 1.08, kd: 1.05, adr: 72.1 },
      { id: '9', name: 'HooXi', rating: 0.92, kd: 0.89, adr: 65.4 },
      { id: '10', name: 'Aleksib', rating: 0.95, kd: 0.92, adr: 67.8 }
    ]
  },
  {
    id: '3',
    name: 'FaZe Clan',
    logo: '🔥',
    rating: 1.22,
    winRate: 75,
    avgRounds: 16.0,
    recentForm: ['W', 'W', 'W', 'L', 'W'],
    players: [
      { id: '11', name: 'karrigan', rating: 1.02, kd: 0.98, adr: 70.2 },
      { id: '12', name: 'rain', rating: 1.16, kd: 1.13, adr: 77.9 },
      { id: '13', name: 'Twistzz', rating: 1.19, kd: 1.16, adr: 79.5 },
      { id: '14', name: 'ropz', rating: 1.21, kd: 1.18, adr: 80.3 },
      { id: '15', name: 'broky', rating: 1.14, kd: 1.11, adr: 76.1 }
    ]
  },
  {
    id: '4',
    name: 'Astralis',
    logo: '⭐',
    rating: 1.08,
    winRate: 65,
    avgRounds: 15.2,
    recentForm: ['L', 'W', 'L', 'W', 'L'],
    players: [
      { id: '16', name: 'device', rating: 1.12, kd: 1.09, adr: 74.6 },
      { id: '17', name: 'k0nfig', rating: 1.06, kd: 1.03, adr: 72.8 },
      { id: '18', name: 'blameF', rating: 1.01, kd: 0.98, adr: 69.5 },
      { id: '19', name: 'Xyp9x', rating: 0.94, kd: 0.91, adr: 64.2 },
      { id: '20', name: 'gla1ve', rating: 0.89, kd: 0.86, adr: 61.7 }
    ]
  }
];

export const mockMatches: Match[] = [
  {
    id: '1',
    team1: mockTeams[0], // NAVI
    team2: mockTeams[1], // G2
    date: '2024-10-07T18:00:00Z',
    tournament: 'BLAST Premier Fall',
    odds: { team1: 1.65, team2: 2.20 },
    prediction: {
      winner: 'NAVI',
      confidence: 72,
      recommendation: 'safe'
    },
    status: 'upcoming'
  },
  {
    id: '2',
    team1: mockTeams[2], // FaZe
    team2: mockTeams[3], // Astralis
    date: '2024-10-07T20:30:00Z',
    tournament: 'ESL Pro League',
    odds: { team1: 1.45, team2: 2.75 },
    prediction: {
      winner: 'FaZe Clan',
      confidence: 85,
      recommendation: 'safe'
    },
    status: 'upcoming'
  },
  {
    id: '3',
    team1: mockTeams[1], // G2
    team2: mockTeams[2], // FaZe
    date: '2024-10-06T16:00:00Z',
    tournament: 'IEM Katowice',
    odds: { team1: 1.95, team2: 1.85 },
    prediction: {
      winner: 'FaZe Clan',
      confidence: 58,
      recommendation: 'risky'
    },
    status: 'finished',
    score: { team1: 14, team2: 16 }
  }
];