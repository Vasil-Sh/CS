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
   * Parse team data from combined text format
   * Format examples:
   * - "Tyloo (СS: Рідко коли вистрілює як команда...)"
   * - "Virtus Pro Дота: БАН проти топ 100..."
   * - "Team Falcons Дота: БАН - в якій би не були..."
   */
  private parseTeamData(text: string): RiskyTeamFromSheet | null {
    if (!text || text.trim() === '' || text.includes('⛔ Ризикована команда')) {
      return null;
    }

    const cleanText = text.trim();
    
    // Detect game (CS or Dota)
    let game = 'CS';
    const gameMatch = cleanText.match(/(?:СS|CS|Дота):/i);
    if (gameMatch) {
      const gameStr = gameMatch[0].toLowerCase();
      game = gameStr.includes('дота') ? 'Дота' : 'CS';
    }

    // Detect status
    let status = 'Обережно'; // default
    if (cleanText.includes('БАН')) {
      status = 'БАН';
    } else if (cleanText.includes('Нестабільні') || cleanText.includes('нестабільн')) {
      status = 'Нестабільні';
    } else if (cleanText.includes('Рідко') || cleanText.includes('рідко')) {
      status = 'Рідко';
    } else if (cleanText.includes('Обережно') || cleanText.includes('обережно')) {
      status = 'Обережно';
    }

    // Extract team name (everything before the game indicator or opening parenthesis)
    let teamName = cleanText;
    
    // Try to extract name before game indicator
    const gameIndicatorMatch = cleanText.match(/^(.+?)(?:\s*\(?\s*(?:СS|CS|Дота):)/i);
    if (gameIndicatorMatch) {
      teamName = gameIndicatorMatch[1].trim();
    } else {
      // Try to extract name before opening parenthesis
      const parenMatch = cleanText.match(/^(.+?)\s*\(/);
      if (parenMatch) {
        teamName = parenMatch[1].trim();
      }
    }

    // Extract notes (everything after the game indicator)
    let notes = '';
    const notesMatch = cleanText.match(/(?:СS|CS|Дота):\s*(.+)/i);
    if (notesMatch) {
      notes = notesMatch[1].trim();
      // Remove status from notes if it's at the beginning
      notes = notes.replace(/^(?:БАН|Нестабільні|Рідко|Обережно)\s*-?\s*/i, '');
    }

    // Clean up team name
    teamName = teamName
      .replace(/\s*\(.*$/, '') // Remove anything after opening parenthesis
      .replace(/\s+$/, '') // Remove trailing spaces
      .trim();

    if (!teamName) {
      return null;
    }

    return {
      name: teamName,
      game,
      status,
      notes
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
        
        // Process columns L and N (indices 11 and 13)
        // Column L is at index 11
        if (values.length > 11 && values[11]) {
          const teamData = this.parseTeamData(values[11]);
          if (teamData) {
            riskyTeams.push(teamData);
          }
        }
        
        // Column N is at index 13
        if (values.length > 13 && values[13]) {
          const teamData = this.parseTeamData(values[13]);
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