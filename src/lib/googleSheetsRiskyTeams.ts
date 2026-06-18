import { SPREADSHEET_ID_DATA } from './sheetsConfig';

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
    
    // Detect game (CS or Dota)
    let game = 'CS'; // default
    const gameMatch = cleanNotes.match(/(?:СS|CS|Дота)/i);
    if (gameMatch) {
      const gameStr = gameMatch[0].toLowerCase();
      game = gameStr.includes('дота') ? 'Дота' : 'CS';
    }

    // Detect status. If nothing matches, fall back to "Без статусу" (no status yet)
    let status = 'Без статусу';
    if (cleanNotes.includes('БАН')) {
      status = 'БАН';
    } else if (cleanNotes.includes('Нестабільні') || cleanNotes.includes('нестабільн')) {
      status = 'Нестабільні';
    } else if (cleanNotes.includes('Рідко') || cleanNotes.includes('рідко')) {
      status = 'Рідко';
    } else if (cleanNotes.includes('Обережно') || cleanNotes.includes('обережно')) {
      status = 'Обережно';
    } else if (cleanNotes.includes('Надійна') || cleanNotes.includes('надійн')) {
      status = 'Надійна';
    }

    // Clean up notes - remove game indicator and status from the beginning
    const finalNotes = cleanNotes
      .replace(/^\s*\(?\s*(?:СS|CS|Дота):\s*/i, '') // Remove game indicator
      .replace(/^(?:БАН|Нестабільні|Рідко|Обережно)\s*-?\s*/i, '') // Remove status
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
   */
  async fetchRiskyTeamsFromCSV(customSheetId?: string): Promise<RiskyTeamFromSheet[]> {
    try {
      const sheetId = customSheetId || this.SHEET_ID;
      const isCustomSheet = !!customSheetId;

      // Export as CSV
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
      
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
          // Default sheet: columns L/M (11/12) and N/O (13/14)
          if (values.length > 11 && values[11]) {
            const teamName = values[11];
            const teamNotes = values.length > 12 ? values[12] : '';
            const teamData = this.parseTeamData(teamName, teamNotes);
            if (teamData) {
              riskyTeams.push(teamData);
            }
          }
          
          // Process columns N and O (indices 13 and 14)
          if (values.length > 13 && values[13]) {
            const teamName = values[13];
            const teamNotes = values.length > 14 ? values[14] : '';
            const teamData = this.parseTeamData(teamName, teamNotes);
            if (teamData) {
              riskyTeams.push(teamData);
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
   */
  async fetchRiskyTeams(customSheetId?: string): Promise<RiskyTeamFromSheet[]> {
    return await this.fetchRiskyTeamsFromCSV(customSheetId);
  }
}

export const googleSheetsRiskyTeamsService = new GoogleSheetsRiskyTeamsService();