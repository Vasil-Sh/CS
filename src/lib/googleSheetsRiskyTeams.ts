// ═══════════════════════════════════════════
// Risky Teams — proxied through backend API
// Replaces the old Google Sheets CSV export.
// ═══════════════════════════════════════════

import { api } from './apiClient';

export interface RiskyTeamFromSheet {
  name: string;
  game: string;
  status: string;
  notes: string;
}

interface ApiRiskyTeam {
  id: number;
  name: string;
}

class GoogleSheetsRiskyTeamsService {
  /**
   * Fetch risky teams from backend API.
   * @param _customSheetId - ignored (kept for backward compat), teams now come from DB
   * @param _sheetGid - ignored (kept for backward compat)
   */
  async fetchRiskyTeams(): Promise<RiskyTeamFromSheet[]> {
    try {
      const teams = await api.get<ApiRiskyTeam[]>('/risky-teams');
      return teams.map((t) => ({
        name: t.name,
        game: 'CS',
        status: '',
        notes: '',
      }));
    } catch (err: unknown) {
      console.error('[RiskyTeams] Failed to fetch from API:', (err as Error).message);
      return [];
    }
  }

  /** Add a team (admin only) */
  async addTeam(name: string): Promise<void> {
    await api.post('/risky-teams', { name });
  }

  /** Remove a team (admin only) */
  async removeTeam(id: number): Promise<void> {
    await api.delete(`/risky-teams/${id}`);
  }
}

export const googleSheetsRiskyTeamsService = new GoogleSheetsRiskyTeamsService();
