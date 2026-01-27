// Service for fetching risky teams from Google Sheets
export interface RiskyTeamFromSheet {
  name: string;
  game: string;
  status: string;
  notes: string;
}

class GoogleSheetsRiskyTeamsService {
  private readonly SHEET_ID = '1WPchid4Di6XjUehfX1gnBinknUBiqiirSs16Vbn7rvw';
  private readonly RANGE = 'Sheet1!L2:O'; // Columns L, M, N, O starting from row 2

  /**
   * Fetch risky teams data from Google Sheets
   * Uses Google Sheets API v4 with public access
   */
  async fetchRiskyTeamsFromSheet(): Promise<RiskyTeamFromSheet[]> {
    try {
      // Use Google Sheets API v4 - public spreadsheet access
      const url = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      // Parse the response (Google returns JSONP, need to extract JSON)
      const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
      if (!jsonMatch) {
        throw new Error('Failed to parse Google Sheets response');
      }
      
      const data = JSON.parse(jsonMatch[1]);
      const rows = data.table.rows;
      
      const riskyTeams: RiskyTeamFromSheet[] = [];
      
      // Process each row
      for (const row of rows) {
        const cells = row.c;
        
        // Skip empty rows
        if (!cells || cells.length < 4) continue;
        
        // Extract values from columns L, M, N, O (indices 11, 12, 13, 14)
        // Adjust indices based on actual column positions
        const name = cells[11]?.v || cells[11]?.f || '';
        const game = cells[12]?.v || cells[12]?.f || '';
        const status = cells[13]?.v || cells[13]?.f || '';
        const notes = cells[14]?.v || cells[14]?.f || '';
        
        // Skip if name is empty
        if (!name || name.trim() === '') continue;
        
        riskyTeams.push({
          name: String(name).trim(),
          game: String(game).trim() || 'CS',
          status: String(status).trim() || 'Обережно',
          notes: String(notes).trim()
        });
      }
      
      return riskyTeams;
    } catch (error) {
      console.error('Error fetching risky teams from Google Sheets:', error);
      throw new Error('Не вдалося завантажити дані з Google Sheets. Перевірте доступ до документа.');
    }
  }

  /**
   * Alternative method using CSV export
   * More reliable for public spreadsheets
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
        
        // Columns L, M, N, O are indices 11, 12, 13, 14
        if (values.length < 15) continue;
        
        const name = values[11]?.trim() || '';
        const game = values[12]?.trim() || '';
        const status = values[13]?.trim() || '';
        const notes = values[14]?.trim() || '';
        
        // Skip if name is empty or is a header
        if (!name || name === '⛔ Ризикована команда') continue;
        
        riskyTeams.push({
          name,
          game: game || 'CS',
          status: status || 'Обережно',
          notes
        });
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
        inQuotes = !inQuotes;
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
   * Tries CSV method first (more reliable), falls back to API method
   */
  async fetchRiskyTeams(): Promise<RiskyTeamFromSheet[]> {
    try {
      // Try CSV method first
      return await this.fetchRiskyTeamsFromCSV();
    } catch (error) {
      console.warn('CSV method failed, trying API method:', error);
      // Fallback to API method
      return await this.fetchRiskyTeamsFromSheet();
    }
  }
}

export const googleSheetsRiskyTeamsService = new GoogleSheetsRiskyTeamsService();