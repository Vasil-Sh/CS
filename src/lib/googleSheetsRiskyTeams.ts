import { SPREADSHEET_ID_DATA, SHEET_GID_RISKY_TEAMS } from './sheetsConfig';

// Service for fetching risky teams from Google Sheets
export interface RiskyTeamFromSheet {
  name: string;
  game: string;
  status: string;
  notes: string;
}

class GoogleSheetsRiskyTeamsService {
  private readonly SHEET_ID = SPREADSHEET_ID_DATA;

  /**
   * Parse team data from structured columns (A=name, B=game, C=status, D=comment)
   * Used when user provides their own Google Sheets link
   */
  private parseTeamDataStructured(name: string, game: string, status: string, comment: string): RiskyTeamFromSheet | null {
    if (!name || name.trim() === '') {
      return null;
    }
    
    const cleanName = name.trim();
    const cleanGame = game.trim() || 'CS';
    const cleanStatus = status.trim() || 'Без статусу';
    const cleanComment = comment.trim();
    
    return {
      name: cleanName,
      game: cleanGame,
      status: cleanStatus,
      notes: cleanComment
    };
  }

  /**
   * Parse team data from a single cell containing name+status+game+notes.
   * Format examples (new style — all in one cell):
   *   "Vitality 🟩 CS У фіналах часто вимикаються..."
   *   "Virtus Pro Dota2:в якій би не були вони формі..."
   *
   * Status emoji mapping:
   *   🟩 → Обережно (green square)
   *   🟨 → Нестабільні (yellow square)
   *   🟥 → БАН (red square)
   */
  private parseTeamDataFromSingleCell(cell: string): RiskyTeamFromSheet | null {
    if (!cell || cell.trim() === '') return null;

    const clean = cell.trim();

    // Must contain either a status emoji or an explicit game keyword to be a valid team entry
    const hasStatusEmoji = /[🟩🟨🟥]/.test(clean);
    const hasGameKeyword = /\b(?:CS2|Dota2)\b|\b(?:CS|Дота)\b/i.test(clean);
    if (!hasStatusEmoji && !hasGameKeyword) return null;

    // Skip date-only entries (e.g. "CS: 07/05/2026")
    if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(clean)) return null;
    // Skip entries that are just dates with game prefix
    if (/^(?:CS|Дота|Dota2|CS2)\s*[:.]\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}$/i.test(clean)) return null;

    // Detect status from emoji
    let status = 'Без статусу';
    if (clean.includes('🟥')) status = 'БАН';
    else if (clean.includes('🟨')) status = 'Нестабільні';
    else if (clean.includes('🟩')) status = 'Обережно';

    // Detect game
    let game = 'CS';
    const gameMatch = clean.match(/(?:CS2|Dota2|CS|Дота)/i);
    if (gameMatch) {
      const g = gameMatch[0].toLowerCase();
      game = g.includes('дота') || g.includes('dota') ? 'Дота' : 'CS';
    }

    // Extract team name: everything from start until we hit a status emoji or game: pattern
    let name = '';
    const emojiOrGameIdx = clean.search(/[🟩🟨🟥]|\s+(?:CS2|CS|Дота|Dota2)[:\s]/i);
    if (emojiOrGameIdx > 0) {
      name = clean.substring(0, emojiOrGameIdx).trim();
    } else {
      // Fallback: take up to first game keyword
      const gameIdx = clean.search(/\b(?:CS2|CS|Дота|Dota2)\b/i);
      name = gameIdx > 0 ? clean.substring(0, gameIdx).trim() : clean;
    }

    if (!name || name.length < 2) return null;
    // Don't allow names that look like dates or generic words
    if (/^\d+$/.test(name) || name.length > 50) return null;

    // Extract notes: everything after name + optional status emoji + optional game keyword
    let notes = clean.replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '');
    notes = notes.replace(/[🟩🟨🟥]\s*/g, '');
    notes = notes.replace(/^(?:CS2|CS|Дота|Dota2)[:\s]*\s*/i, '');
    notes = notes.trim();

    return { name, game, status, notes };
  }

  /**
   * Parse team data from name and notes
   * Name is in one column, notes in the next column
   * Notes format examples:
   * - "(СS: Рідко коли вистрілює як команда...)"
   * - "Дота: БАН проти топ 100..."
   * - "Дота: БАН - в якій би не були..."
   */
  private parseTeamData(name: string, notes: string): RiskyTeamFromSheet | null {
    if (!name || name.trim() === '' || name.includes('⛔ Ризикована команда')) {
      return null;
    }

    const cleanName = name.trim();
    const cleanNotes = notes ? notes.trim() : '';

    // If notes are empty, try parsing the name as a single-cell format
    if (!cleanNotes) {
      return this.parseTeamDataFromSingleCell(cleanName);
    }

    // Detect game (CS or Dota)
    let game = 'CS'; // default
    const gameMatch = cleanNotes.match(/(?:СS|CS|Дота)/i);
    if (gameMatch) {
      const gameStr = gameMatch[0].toLowerCase();
      game = gameStr.includes('дота') ? 'Дота' : 'CS';
    }

    // Detect status from emoji in notes first (new format), then from text
    let status = 'Без статусу';
    // Also check in cleanName (in case emoji is in the name cell)
    const combinedForEmoji = cleanName + ' ' + cleanNotes;
    if (combinedForEmoji.includes('🟥')) status = 'БАН';
    else if (combinedForEmoji.includes('🟨')) status = 'Нестабільні';
    else if (combinedForEmoji.includes('🟩')) status = 'Обережно';
    // Fall back to text-based detection
    else if (cleanNotes.includes('БАН') || cleanName.includes('БАН')) status = 'БАН';
    else if (cleanNotes.includes('Нестабільні') || cleanNotes.includes('нестабільн')) status = 'Нестабільні';
    else if (cleanNotes.includes('Рідко') || cleanNotes.includes('рідко')) status = 'Рідко';
    else if (cleanNotes.includes('Обережно') || cleanNotes.includes('обережно')) status = 'Обережно';
    else if (cleanNotes.includes('Надійна') || cleanNotes.includes('надійн')) status = 'Надійна';

    // Clean up notes
    const finalNotes = cleanNotes
      .replace(/[🟩🟨🟥]/g, '') // Remove status emoji
      .replace(/^\s*\(?\s*(?:СS|CS|Дота|Dota2):\s*/i, '') // Remove game indicator
      .replace(/^(?:БАН|Нестабільні|Рідко|Обережно)\s*-?\s*/i, '') // Remove status text
      .replace(/^\s*\(/, '') // Remove opening parenthesis
      .replace(/\)\s*$/, '') // Remove closing parenthesis
      .trim();

    return {
      name: cleanName,
      game,
      status,
      notes: finalNotes
    };
  }

  /**
   * Fetch risky teams from CSV export
   * @param customSheetId - If provided, uses this spreadsheet ID and parses columns A-D (structured format).
   *                        If not provided, uses the default sheet and parses columns L/M and N/O.
   * @param sheetGid - The gid of the sheet to export. Defaults to SHEET_GID_RISKY_TEAMS for default sheet.
   */
  async fetchRiskyTeamsFromCSV(customSheetId?: string, sheetGid?: string): Promise<RiskyTeamFromSheet[]> {
    try {
      const sheetId = customSheetId || this.SHEET_ID;
      const isCustomSheet = !!customSheetId;

      // Export as CSV — use explicit gid if provided, otherwise default
      const gid = sheetGid || (isCustomSheet ? '0' : SHEET_GID_RISKY_TEAMS);
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      // Parse CSV properly handling multiline values in quotes
      const rows = this.parseCSV(csvText);
      
      const riskyTeams: RiskyTeamFromSheet[] = [];
      
      // Skip header row, start from row 2 (index 1)
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];

        if (isCustomSheet) {
          // Custom sheet: columns A=team name, B=game, C=status, D=comment
          if (values.length > 0 && values[0]) {
            const teamName = values[0];
            const teamGame = values.length > 1 ? values[1] : '';
            const teamStatus = values.length > 2 ? values[2] : '';
            const teamComment = values.length > 3 ? values[3] : '';
            const teamData = this.parseTeamDataStructured(teamName, teamGame, teamStatus, teamComment);
            if (teamData) {
              riskyTeams.push(teamData);
            }
          }
        } else {
          // Default sheet: columns L (11), M (12), N (13), O (14) each contain a full team entry
          // (name + optional status emoji + game + notes)
          const teamColumns = [11, 12, 13, 14]; // L, M, N, O (0-indexed)
          
          for (const colIdx of teamColumns) {
            if (values.length > colIdx && values[colIdx]) {
              const cellValue = values[colIdx].trim();
              if (cellValue) {
                // First try: parse as single-cell format (all info in one cell)
                const teamData = this.parseTeamDataFromSingleCell(cellValue);
                if (teamData) {
                  riskyTeams.push(teamData);
                }
              }
            }
          }
        }
      }
      
      return riskyTeams;
    } catch (error) {
      console.error('Error fetching risky teams from CSV:', error);
      throw new Error('Не вдалося завантажити дані з Google Sheets. Перевірте доступ до документа.');
    }
  }

  /**
   * Parse CSV text into rows, properly handling quoted multiline values
   */
  private parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote inside quoted value
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentValue);
        currentValue = '';
      } else if (char === '\n' && !inQuotes) {
        // End of row
        currentRow.push(currentValue);
        rows.push(currentRow);
        currentRow = [];
        currentValue = '';
      } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
        // Windows line ending
        currentRow.push(currentValue);
        rows.push(currentRow);
        currentRow = [];
        currentValue = '';
        i++; // Skip \n
      } else {
        // Regular character (including \n inside quotes)
        currentValue += char;
      }
    }
    
    // Add last value and row if not empty
    if (currentValue || currentRow.length > 0) {
      currentRow.push(currentValue);
      rows.push(currentRow);
    }
    
    return rows;
  }

  /**
   * Main method to fetch risky teams
   * @param customSheetId - If provided, uses this spreadsheet ID instead of the default one
   * @param sheetGid - If provided, exports this specific sheet instead of the default
   */
  async fetchRiskyTeams(customSheetId?: string, sheetGid?: string): Promise<RiskyTeamFromSheet[]> {
    return await this.fetchRiskyTeamsFromCSV(customSheetId, sheetGid);
  }
}

export const googleSheetsRiskyTeamsService = new GoogleSheetsRiskyTeamsService();