// Service for fetching risky teams from Google Sheets
export interface RiskyTeamFromSheet {
  name: string;
  game: string;
  status: string;
  notes: string;
}

class GoogleSheetsRiskyTeamsService {
  private readonly SHEET_ID = '1WPchid4Di6XjUehfX1gnBinknUBiqiirSs16Vbn7rvw';

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

    // Detect status
    let status = 'Обережно'; // default
    if (cleanNotes.includes('БАН')) {
      status = 'БАН';
    } else if (cleanNotes.includes('Нестабільні') || cleanNotes.includes('нестабільн')) {
      status = 'Нестабільні';
    } else if (cleanNotes.includes('Рідко') || cleanNotes.includes('рідко')) {
      status = 'Рідко';
    } else if (cleanNotes.includes('Обережно') || cleanNotes.includes('обережно')) {
      status = 'Обережно';
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
   */
  async fetchRiskyTeamsFromCSV(): Promise<RiskyTeamFromSheet[]> {
    try {
      // Export as CSV
      const url = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/export?format=csv&gid=0`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      const riskyTeams: RiskyTeamFromSheet[] = [];
      
      // Skip header row, start from row 2 (index 1)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handle quoted values)
        const values = this.parseCSVLine(line);
        
        // Process columns L and M (indices 11 and 12)
        // Column L (index 11) = team name
        // Column M (index 12) = notes
        if (values.length > 11 && values[11]) {
          const teamName = values[11];
          const teamNotes = values.length > 12 ? values[12] : '';
          const teamData = this.parseTeamData(teamName, teamNotes);
          if (teamData) {
            riskyTeams.push(teamData);
          }
        }
        
        // Process columns N and O (indices 13 and 14)
        // Column N (index 13) = team name
        // Column O (index 14) = notes
        if (values.length > 13 && values[13]) {
          const teamName = values[13];
          const teamNotes = values.length > 14 ? values[14] : '';
          const teamData = this.parseTeamData(teamName, teamNotes);
          if (teamData) {
            riskyTeams.push(teamData);
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
   * Parse a CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // Handle escaped quotes
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Main method to fetch risky teams
   */
  async fetchRiskyTeams(): Promise<RiskyTeamFromSheet[]> {
    return await this.fetchRiskyTeamsFromCSV();
  }
}

export const googleSheetsRiskyTeamsService = new GoogleSheetsRiskyTeamsService();