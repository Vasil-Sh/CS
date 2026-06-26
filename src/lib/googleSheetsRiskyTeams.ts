import { SPREADSHEET_ID_DATA, SHEET_GID_RISKY_TEAMS, SHEET_GID_RISKY_TEAMS_CLEAN } from './sheetsConfig';

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

    // Skip date-only or game+date entries
    if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(clean)) return null;
    if (/^(?:(?:CS2|Dota2|CS|Дота)\s*[:.-]?\s*)?\d{1,2}[./]\d{1,2}[./]\d{2,4}\s*$/i.test(clean)) return null;

    // Must contain either a status emoji or an explicit game keyword to be a valid team entry
    const hasStatusEmoji = /[🟩🟨🟥]/u.test(clean);
    const hasGameKeyword = /\b(?:CS2|Dota2|CS|Дота)\b/i.test(clean); // game keyword present anywhere
    if (!hasStatusEmoji && !hasGameKeyword) return null;

    // Detect status from emoji
    let status = 'Без статусу';
    if (clean.includes('🟥')) status = 'БАН';
    else if (clean.includes('🟨')) status = 'Нестабільні';
    else if (clean.includes('🟩')) status = 'Обережно';

    // Detect game
    let game = 'CS';
    const gameMatch = clean.match(/(?:CS2|Dota2|Dota|CS|Дота)/i);
    if (gameMatch) {
      const g = gameMatch[0].toLowerCase();
      game = g.includes('дота') || g.includes('dota') ? 'Дота' : 'CS';
    }

    // Extract team name: everything from start until we hit a status emoji or game: pattern
    let name = '';
    const emojiOrGameIdx = clean.search(/[🟩🟨🟥]|\s+(?:CS2|CS|Дота|Dota2)[:\s]/iu);
    if (emojiOrGameIdx > 0) {
      name = clean.substring(0, emojiOrGameIdx).trim();
    } else {
      // Fallback: take up to first game keyword
      const gameIdx = clean.search(/\b(?:CS2|CS|Дота|Dota2)\b/i);
      name = gameIdx > 0 ? clean.substring(0, gameIdx).trim() : clean;
    }

    // Reject entries where name is just "CS", "Dota2", a date, or too short
    if (!name || name.length < 3) return null;
    if (/^(?:CS2|Dota2|CS|Дота)$/i.test(name)) return null;
    if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(name)) return null;

    // Extract notes: everything after name + optional status emoji + optional game keyword
    let notes = clean.replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '');
    notes = notes.replace(/[🟩🟨🟥]\s*/gu, '');
    notes = notes.replace(/^(?:CS2|CS|Дота|Dota2)[:\s]*\s*/i, '');
    notes = notes.trim();

    // Reject if notes are just a date with optional prefix
    if (notes && /^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(notes)) return null;

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
    const gameMatch = cleanNotes.match(/(?:СS|CS|CS2|Дота|Dota2|Dota)/i);
    if (gameMatch) {
      const gameStr = gameMatch[0].toLowerCase();
      game = gameStr.includes('дота') || gameStr.includes('dota') ? 'Дота' : 'CS';
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
      .replace(/[🟩🟨🟥]/gu, '') // Remove status emoji
      .replace(/^\s*\(?\s*(?:СS|CS|CS2|Дота|Dota2|Dota)\s*[:.]?\s*/i, '') // Remove game indicator
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
      // If using the default spreadsheet without manual URL, use clean teams sheet
      const isDefaultSheet = sheetId === this.SHEET_ID;
      let gid: string;
      let parseAsCleanSheet = false;
      
      if (sheetGid) {
        gid = sheetGid;
        // If the GID matches the clean teams sheet, use that parser
        parseAsCleanSheet = (gid === SHEET_GID_RISKY_TEAMS_CLEAN);
      } else if (isDefaultSheet) {
        // Default sheet → use the clean teams sheet
        gid = SHEET_GID_RISKY_TEAMS_CLEAN;
        parseAsCleanSheet = true;
      } else {
        gid = '0';
      }
      
      if (import.meta.env.DEV) console.log('[RiskyTeams] Using sheetId:', sheetId, 'gid:', gid, 'isCustomSheet:', isCustomSheet, 'parseAsCleanSheet:', parseAsCleanSheet);
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      // Parse CSV properly handling multiline values in quotes
      const rows = this.parseCSV(csvText);
      
      if (import.meta.env.DEV) {
        console.log('[RiskyTeams] CSV rows total:', rows.length);
        if (rows.length > 0) {
          console.log('[RiskyTeams] Header row:', JSON.stringify(rows[0]));
          console.log('[RiskyTeams] First 5 data rows:', rows.slice(1, Math.min(6, rows.length)).map(r => JSON.stringify(r)));
        }
      }
      
      const riskyTeams: RiskyTeamFromSheet[] = [];
      
      // Skip header row, start from row 2 (index 1)
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];

        if (parseAsCleanSheet) {
          // Clean teams sheet: pairs of columns — A=team name, B=notes (emoji+game+comment), C=name, D=notes, etc.
          // Example: A="Vitality", B="🟩 CS У фіналах часто вимикаються..."
          //          C="Virtus Pro", D="Dota2:в якій би не були вони формі..."
          for (let col = 0; col + 1 < values.length; col += 2) {
            const nameCell = values[col]?.trim();
            const notesCell = values[col + 1]?.trim();
            
            if (!nameCell) continue;
            
            const teamData = this.parseTeamData(nameCell, notesCell || '');
            if (teamData) {
              riskyTeams.push(teamData);
            }
          }
        } else if (isCustomSheet) {
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
          // Default sheet (old format): columns L/M (11/12) and N/O (13/14)
          // L=team name, M=notes (may contain emoji status + game info)
          // N=team name, O=notes
          const pairs: [number, number][] = [[11, 12], [13, 14]];
          
          for (const [nameCol, notesCol] of pairs) {
            if (values.length > nameCol && values[nameCol]) {
              const teamName = values[nameCol].trim();
              const teamNotes = values.length > notesCol ? (values[notesCol] || '').trim() : '';
              
              if (teamName.includes('📅') || teamName.includes('Ризикована') || teamName === '') continue;
              
              const teamData = this.parseTeamData(teamName, teamNotes);
              if (teamData) {
                riskyTeams.push(teamData);
              }
            }
          }
        }
      }
      if (riskyTeams.length > 0 && riskyTeams.length < 10) {
        if (import.meta.env.DEV) riskyTeams.forEach((t, i) => console.log(`[RiskyTeams] Team ${i}:`, t.name, t.game, t.status));
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
    // If a custom URL is provided, try to extract GID from it
    if (customSheetId && !sheetGid) {
      // Check if the custom URL contains a gid parameter
      // The fetchRiskyTeamsFromCSV will handle it
    }
    return await this.fetchRiskyTeamsFromCSV(customSheetId, sheetGid);
  }
}

export const googleSheetsRiskyTeamsService = new GoogleSheetsRiskyTeamsService();