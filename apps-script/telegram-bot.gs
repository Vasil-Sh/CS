/**
 * ═══════════════════════════════════════════════════════
 *  MatchIQ — Telegram Bot → Google Sheets Webhook
 * ═══════════════════════════════════════════════════════
 * 
 * Deploy as: Google Apps Script → Deploy → Web App (Execute as "me", Access "Anyone")
 * 
 * Setup steps:
 * 1. Create a bot via @BotFather → get TOKEN
 * 2. Paste TOKEN below in the BOT_TOKEN constant
 * 3. Set SPREADSHEET_ID to your Google Sheets ID (same as MatchIQ data sheet)
 * 4. Deploy this script as a web app
 * 5. Copy the deployment URL
 * 6. Set webhook: visit https://api.telegram.org/bot<TOKEN>/setWebhook?url=<DEPLOY_URL>
 * 7. Add the bot as ADMIN to all Telegram groups/channels you want to track
 * 8. In MatchIQ, paste the deployment URL in Settings → Telegram Bot
 *
 * The bot will:
 * - Automatically receive all messages from tracked groups
 * - Parse betting info (teams, odds, prediction)
 * - Write parsed bets to your Google Sheets (USDT sheet)
 * - Store raw messages for manual review
 */

// ── CONFIG ──

const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // ← Replace with @BotFather token
const SPREADSHEET_ID = '1WPchid4Di6XjUehfX1gnBinknUBiqiirSs16Vbn7rvw'; // ← MatchIQ data sheet

// ── MAIN ──

function doPost(e) {
  try {
    const update = JSON.parse(e.postData.contents);
    
    // Only process channel/group messages
    if (!update.message && !update.channel_post) {
      return ContentService.createTextOutput('OK');
    }
    
    const msg = update.message || update.channel_post;
    const chatId = msg.chat.id.toString();
    const chatTitle = msg.chat.title || 'Unknown Channel';
    const text = msg.text || msg.caption || '';
    
    // Skip non-text messages
    if (!text.trim()) {
      return ContentService.createTextOutput('OK (no text)');
    }
    
    // Parse the message
    const parsed = parseBetMessage(text);
    
    // Store raw message always (for debug/review)
    logRawMessage(chatId, chatTitle, text, msg.date);
    
    // If parsing succeeded, write to USDT sheet
    if (parsed && parsed.match && parsed.odds) {
      writeBetToSheet(parsed, chatTitle, msg.date);
      
      // Notify admin (optional)
      notifyAdmin(`✅ Ставку розпізнано з "${chatTitle}":\n${parsed.match} @ ${parsed.odds}`);
    } else {
      notifyAdmin(`⚠️ Не розпізнано з "${chatTitle}":\n${text.substring(0, 100)}`);
    }
    
    return ContentService.createTextOutput('OK');
  } catch (error) {
    console.error('doPost error:', error);
    return ContentService.createTextOutput('ERROR: ' + error.message);
  }
}

// ── PARSER (same logic as TelegramGroups.tsx) ──

function parseBetMessage(text) {
  if (!text.trim()) return null;
  
  var team1 = '';
  var team2 = '';
  var odds = '';
  
  // Strip emojis
  var clean = text.replace(/[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}]/gu, '').trim();
  
  // Pattern 1: "Team1 vs Team2" / "Team1 - Team2"
  var vsMatch = clean.match(/(.+?)\s+(?:vs\.?|VS\.?|против|—|–|-)\s+(.+)/i);
  if (!vsMatch) vsMatch = clean.match(/(.+?)\s*\/\s*(.+)/);
  if (!vsMatch) vsMatch = clean.match(/([A-Z][\w\s.]{2,25})\s{2,}([A-Z][\w\s.]{2,25})/);
  
  if (vsMatch) {
    team1 = vsMatch[1].trim();
    team2 = vsMatch[2].trim();
  }
  
  // Extract odds
  var oddsMatch = clean.match(/(?:кое?ф|odds?|@|кф\.?)\s*[:=]?\s*(\d+[.,]\d+)|\b(\d+[.,]\d{2})\b(?!\s*(?:%|процент))/i);
  if (oddsMatch) {
    odds = (oddsMatch[1] || oddsMatch[2]).replace(',', '.');
  } else {
    var lastNum = clean.match(/(\d+[.,]\d{2})\s*$/);
    if (lastNum && parseFloat(lastNum[1]) >= 1.01 && parseFloat(lastNum[1]) <= 20) {
      odds = lastNum[1].replace(',', '.');
    }
  }
  
  var matchStr = team1 && team2 ? team1 + ' vs ' + team2 : clean.substring(0, 80);
  
  return {
    team1: team1,
    team2: team2,
    odds: odds,
    match: matchStr
  };
}

// ── WRITE TO GOOGLE SHEETS ──

function writeBetToSheet(parsed, channelTitle, timestamp) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('USDT');
  if (!sheet) {
    sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet('USDT');
    sheet.appendRow([
      'Date', 'Match', 'Team1', 'Team2', 'Bet Type', 'Odds', 'Amount',
      'Result', 'Profit', 'ROI', 'Strategy', 'Notes', 'Format', 'Game',
      'Tournament', 'Match URL', 'Risky Teams'
    ]);
  }
  
  var date = new Date(timestamp * 1000);
  var dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  
  sheet.appendRow([
    dateStr,                   // Date
    parsed.match,              // Match
    parsed.team1,              // Team1
    parsed.team2,              // Team2
    'Ординар',                 // Bet Type
    parsed.odds || '',         // Odds
    '',                        // Amount (fill later)
    'Pending',                 // Result
    '',                        // Profit (fill later)
    '',                        // ROI
    'Telegram Bot',            // Strategy
    'Auto: ' + channelTitle,   // Notes
    '',                        // Format
    'CS2',                     // Game (default)
    '',                        // Tournament
    '',                        // Match URL
    ''                         // Risky Teams
  ]);
}

// ── RAW MESSAGE LOG ──

function logRawMessage(chatId, chatTitle, text, timestamp) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TG_Raw');
  if (!sheet) {
    sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet('TG_Raw');
    sheet.appendRow(['Date', 'Channel ID', 'Channel Title', 'Message Text']);
  }
  
  var date = new Date(timestamp * 1000);
  var dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  
  sheet.appendRow([dateStr, chatId, chatTitle, text]);
}

// ── NOTIFY ADMIN ──

function notifyAdmin(message) {
  // Send notification via Telegram bot to admin
  var adminChatId = getAdminChatId();
  if (!adminChatId || !BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') return;
  
  var url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';
  var payload = {
    chat_id: adminChatId,
    text: '🤖 MatchIQ Bot:\n' + message,
    parse_mode: 'HTML'
  };
  
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}

// Store admin chat ID (set via /start in bot DM)
function getAdminChatId() {
  var scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('ADMIN_CHAT_ID') || '';
}

// ── SETUP: Run this once to enable the bot ──

function setup() {
  if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    throw new Error('Please set BOT_TOKEN first!');
  }
  
  // Delete old webhook
  var deleteUrl = 'https://api.telegram.org/bot' + BOT_TOKEN + '/deleteWebhook';
  UrlFetchApp.fetch(deleteUrl);
  
  // Get the deployment URL
  var scriptUrl = ScriptApp.getService().getUrl();
  if (!scriptUrl) {
    throw new Error('Deploy this script as a Web App first (Deploy → New Deployment → Web App)');
  }
  
  // Set new webhook
  var setUrl = 'https://api.telegram.org/bot' + BOT_TOKEN + '/setWebhook?url=' + encodeURIComponent(scriptUrl);
  var response = UrlFetchApp.fetch(setUrl);
  
  console.log('Webhook set to:', scriptUrl);
  console.log('Response:', response.getContentText());
  
  // Also handle /start command to set admin chat ID
  // (Bot will respond to /start in DM with setup instructions)
}

// ── TEST: Run to verify parsing works ──

function testParse() {
  var tests = [
    '🔥 NaVi vs FaZe @ 1.85\nСтавка на FaZe — уверен на 90%',
    'Spirit — Vitality / кф 2.30 / BO3',
    'G2 vs MOUZ odds 1.65',
    'FaZe против NAVI 2.80'
  ];
  
  tests.forEach(function(t) {
    var result = parseBetMessage(t);
    console.log('Input:', t);
    console.log('Parsed:', JSON.stringify(result));
    console.log('---');
  });
}
