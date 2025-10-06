// WebView2 Bridge Service for communicating with C# WinForms backend

import { CSharpGame, CSharpTeam, CSharpGameDetail, CSharpBridgeResponse, mapCSharpGameToBet, mapCSharpTeamToTeam } from '../types/csharp-models';

declare global {
  interface Window {
    chrome?: {
      webview?: {
        postMessage: (message: string) => void;
        addEventListener: (event: string, callback: (event: MessageEvent) => void) => void;
      };
    };
  }
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

class CSharpBridgeService {
  private messageId = 0;
  private pendingRequests = new Map<number, PendingRequest>();
  private isInitialized = false;

  constructor() {
    this.initializeWebView();
  }

  private initializeWebView() {
    if (typeof window !== 'undefined' && window.chrome?.webview) {
      window.chrome.webview.addEventListener('message', (event) => {
        this.handleMessage(event.data);
      });
      this.isInitialized = true;
      console.log('🔗 WebView2 Bridge initialized successfully');
    } else {
      console.warn('⚠️ WebView2 not available - running in browser mode');
      // For development/testing in browser
      this.isInitialized = false;
    }
  }

  private handleMessage(data: string) {
    try {
      const response = JSON.parse(data);
      const { messageId, success, data: responseData, error } = response;
      
      const pendingRequest = this.pendingRequests.get(messageId);
      if (pendingRequest) {
        this.pendingRequests.delete(messageId);
        if (success) {
          pendingRequest.resolve(responseData);
        } else {
          pendingRequest.reject(new Error(error || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error('Error parsing WebView2 message:', err);
    }
  }

  private sendMessage<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        // Return mock data for development
        resolve(this.getMockData(method) as T);
        return;
      }

      const messageId = ++this.messageId;
      this.pendingRequests.set(messageId, { resolve, reject });

      const message = JSON.stringify({
        messageId,
        method,
        params: params || {}
      });

      try {
        window.chrome!.webview!.postMessage(message);
      } catch (err) {
        this.pendingRequests.delete(messageId);
        reject(err);
      }

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  // Mock data for development/testing
  private getMockData(method: string): CSharpGame[] | CSharpTeam[] | boolean {
    switch (method) {
      case 'getAllGames':
        return this.generateMockGames();
      case 'getAllTeams':
        return this.generateMockTeams();
      case 'getGamesByTeam':
        return this.generateMockGames().slice(0, 5);
      case 'insertGame':
        return true;
      default:
        return [];
    }
  }

  private generateMockGames(): CSharpGame[] {
    const teams = ['NAVI', 'Astralis', 'FaZe', 'G2', 'Vitality', 'NIP', 'Heroic', 'FURIA'];
    const tournaments = ['IEM Katowice', 'ESL Pro League', 'BLAST Premier', 'PGL Major'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      team1: teams[Math.floor(Math.random() * teams.length)],
      team2: teams[Math.floor(Math.random() * teams.length)],
      score1: Math.floor(Math.random() * 3),
      score2: Math.floor(Math.random() * 3),
      stars: Math.floor(Math.random() * 5) + 1,
      type: tournaments[Math.floor(Math.random() * tournaments.length)],
      link: `https://hltv.org/matches/${2370000 + i}`
    }));
  }

  private generateMockTeams(): CSharpTeam[] {
    return [
      { id: 1, name: 'NAVI', position: 1, points: 1000, hltvId: 4608, nameForUrl: 'navi' },
      { id: 2, name: 'Astralis', position: 2, points: 950, hltvId: 6665, nameForUrl: 'astralis' },
      { id: 3, name: 'FaZe', position: 3, points: 900, hltvId: 6667, nameForUrl: 'faze' },
      { id: 4, name: 'G2', position: 4, points: 850, hltvId: 5995, nameForUrl: 'g2' },
      { id: 5, name: 'Vitality', position: 5, points: 800, hltvId: 9565, nameForUrl: 'vitality' }
    ];
  }

  // Public API methods
  async getAllGames(): Promise<CSharpGame[]> {
    return this.sendMessage<CSharpGame[]>('getAllGames');
  }

  async getAllTeams(): Promise<CSharpTeam[]> {
    return this.sendMessage<CSharpTeam[]>('getAllTeams');
  }

  async getGamesByTeam(teamName: string): Promise<CSharpGame[]> {
    return this.sendMessage<CSharpGame[]>('getGamesByTeam', { teamName });
  }

  async getGameDetails(gameLink: string): Promise<CSharpGameDetail[]> {
    return this.sendMessage<CSharpGameDetail[]>('getGameDetails', { gameLink });
  }

  async insertGame(game: Omit<CSharpGame, 'id'>): Promise<boolean> {
    return this.sendMessage<boolean>('insertGame', { game });
  }

  // Convenience methods that return data in React-compatible format
  async getBetsData(): Promise<Record<string, unknown>[]> {
    const games = await this.getAllGames();
    return games.map(mapCSharpGameToBet);
  }

  async getTeamsData(): Promise<Record<string, unknown>[]> {
    const teams = await this.getAllTeams();
    return teams.map(mapCSharpTeamToTeam);
  }

  async getTeamMatches(teamName: string): Promise<Record<string, unknown>[]> {
    const games = await this.getGamesByTeam(teamName);
    return games.map(mapCSharpGameToBet);
  }

  // Check if running in WebView2 environment
  isWebView2(): boolean {
    return this.isInitialized;
  }

  // Get connection status
  getStatus(): { connected: boolean; environment: string } {
    return {
      connected: this.isInitialized,
      environment: this.isInitialized ? 'WebView2' : 'Browser'
    };
  }
}

// Export singleton instance
export const csharpBridge = new CSharpBridgeService();
export default csharpBridge;