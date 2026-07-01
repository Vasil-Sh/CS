// ═══════════════════════════════════════════
// Risky Teams — через backend API + fallback на Google Sheets CSV
// ═══════════════════════════════════════════

import { api } from "./apiClient";

export interface RiskyTeamFromSheet {
  name: string;
  game: string;
  status: string;
  notes: string;
  _apiId?: number;
}

interface ApiRiskyTeam {
  id: number;
  name: string;
  game?: string;
  status?: string;
  notes?: string;
}

const STATUS_EMOJIS: Record<string, string> = {
  "🟥": "БАН",
  "🟨": "Нестабільні",
  "🟩": "Обережно",
};

const GAMES = ["CS", "CS2", "CS:GO", "Dota2", "Дота", "Dota"];

class GoogleSheetsRiskyTeamsService {
  /**
   * Fetch risky teams: try backend API first, fall back to Google Sheets CSV.
   */
  async fetchRiskyTeams(
    customSheetId?: string,
    sheetGid?: string,
  ): Promise<RiskyTeamFromSheet[]> {
    // 1. Try backend API
    if (!customSheetId) {
      try {
        const teams =
          await api.get<(ApiRiskyTeam & { id: number })[]>("/risky-teams");
        return teams.map((t) => ({
          name: t.name,
          game: t.game || "CS",
          status: t.status || "",
          notes: t.notes || "",
          _apiId: t.id,
        }));
      } catch (err: unknown) {
        console.error(
          "[RiskyTeams] Failed to fetch from API:",
          (err as Error).message,
        );
      }
    }

    // 2. Fallback: read directly from Google Sheets CSV (dev only)
    if (import.meta.env.DEV && customSheetId) {
      try {
        const gidParam = sheetGid ? `&gid=${sheetGid}` : "";
        const url = `https://docs.google.com/spreadsheets/d/${customSheetId}/gviz/tq?tqx=out:csv${gidParam}`;
        const response = await fetch(url);
        const text = await response.text();
        if (!text.trim()) return [];

        const rows = text.split("\n").filter((r) => r.trim());
        const parsed: RiskyTeamFromSheet[] = [];

        for (let i = 0; i < rows.length; i++) {
          // Skip header row if it looks like a header
          if (i === 0) {
            const firstCell = rows[i]
              .split(",")[0]
              ?.replace(/"/g, "")
              .trim()
              .toLowerCase();
            if (
              firstCell === "назва" ||
              firstCell === "команда" ||
              firstCell === "team" ||
              firstCell === "name"
            ) {
              continue;
            }
          }

          const columns = parseCSVRow(rows[i]);
          if (columns.length < 2) continue;

          const teamName = columns[0]?.replace(/"/g, "").trim();
          const statusCell = columns[1]?.replace(/"/g, "").trim();

          if (!teamName) continue;

          const { status, game, notes } = parseStatusCell(statusCell);

          parsed.push({ name: teamName, game, status, notes });
        }

        if (import.meta.env.DEV)
          console.log(
            "[RiskyTeams] Loaded from Google Sheets:",
            parsed.length,
            "teams",
          );
        return parsed;
      } catch (err: unknown) {
        console.error(
          "[RiskyTeams] Failed to fetch from Google Sheets:",
          (err as Error).message,
        );
      }
    }

    return [];
  }

  /** Add a team (admin only) */
  async addTeam(
    name: string,
    game?: string,
    status?: string,
    notes?: string,
  ): Promise<void> {
    try {
      await api.post("/risky-teams", {
        name,
        game: game || "",
        status: status || "",
        notes: notes || "",
      });
    } catch {
      // API unavailable — ignore
    }
  }

  /** Remove a team (admin only) */
  async removeTeam(id: number): Promise<void> {
    try {
      await api.delete(`/risky-teams/${id}`);
    } catch {
      // API unavailable — ignore
    }
  }
}

/** Parse a CSV row that may contain quoted strings with commas */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** Parse the B-column (status) cell: extract emoji→status, game, notes */
function parseStatusCell(cell: string): {
  status: string;
  game: string;
  notes: string;
} {
  let status = "";
  let game = "";
  let notes = cell;

  // Detect status from emoji
  for (const [emoji, label] of Object.entries(STATUS_EMOJIS)) {
    if (cell.startsWith(emoji) || cell.includes(emoji)) {
      status = label;
      notes = notes.replace(emoji, "").trim();
      break;
    }
  }

  // If no emoji found, try text-based status
  if (!status) {
    const lower = cell.toLowerCase();
    if (lower.startsWith("бан")) status = "БАН";
    else if (lower.startsWith("нестабільні")) status = "Нестабільні";
    else if (lower.startsWith("обережно")) status = "Обережно";
  }

  // Detect game
  for (const g of GAMES) {
    const idx = notes.toLowerCase().indexOf(g.toLowerCase());
    if (idx >= 0) {
      game =
        g === "CS:GO" ? "CS" : g === "Дота" ? "Дота" : g === "CS2" ? "CS" : g;
      // Remove game from notes
      notes = (
        notes.substring(0, idx) + notes.substring(idx + g.length)
      ).trim();
      // Clean up colons
      notes = notes.replace(/^[:\s]+/, "").trim();
      break;
    }
  }

  // Default game
  if (!game) game = "";

  return { status: status || "", game, notes };
}

export const googleSheetsRiskyTeamsService =
  new GoogleSheetsRiskyTeamsService();
