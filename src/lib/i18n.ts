export type Lang = 'uk' | 'en';

import { useState, useEffect } from 'react';

type TranslationMap = Record<string, Record<Lang, string>>;

/**
 * ─── UI Text translations ───
 * Key format: page.section.element (e.g. "nav.analytics")
 */
const T: TranslationMap = {
  // ── App / Layout ──
  'app.name': { uk: 'MatchIQ', en: 'MatchIQ' },
  'app.help': { uk: 'Потрібна допомога?', en: 'Need help?' },
  'app.helpDesc': { uk: 'Є питання або пропозиції? Напиши нам в Telegram', en: 'Questions or suggestions? Write us on Telegram' },
  'app.writeUs': { uk: 'Написати нам', en: 'Write us' },
  'app.logout': { uk: 'Вийти', en: 'Log out' },
  'app.active': { uk: 'Активний', en: 'Active' },

  // ── Navigation ──
  'nav.analytics': { uk: 'Аналітика', en: 'Analytics' },
  'nav.addRecord': { uk: 'Додати запис', en: 'Add Record' },
  'nav.strategies': { uk: 'Стратегії та Цілі', en: 'Strategies & Goals' },
  'nav.matches': { uk: 'Матчі', en: 'Matches' },
  'nav.profile': { uk: 'Профіль', en: 'Profile' },
  'nav.admin': { uk: 'Адмін панель', en: 'Admin Panel' },

  // ── Analytics ──
  'analytics.title': { uk: 'Аналітика', en: 'Analytics' },
  'analytics.currentBank': { uk: 'Поточний банк', en: 'Current Bank' },
  'analytics.totalProfit': { uk: 'Загальний профіт', en: 'Total Profit' },
  'analytics.totalBets': { uk: 'Всього записів', en: 'Total Records' },
  'analytics.winRate': { uk: 'Вінрейт', en: 'Win Rate' },
  'analytics.activeBets': { uk: 'Активні', en: 'Active' },
  'analytics.wins': { uk: 'Виграші', en: 'Wins' },
  'analytics.losses': { uk: 'Програші', en: 'Losses' },
  'analytics.avgRoi': { uk: 'Середній ROI', en: 'Average ROI' },
  'analytics.profitPositive': { uk: 'Позитивна динаміка', en: 'Positive trend' },
  'analytics.profitNegative': { uk: 'Негативна динаміка', en: 'Negative trend' },
  'analytics.forAllTime': { uk: 'за весь час', en: 'all time' },
  'analytics.pendingResult': { uk: 'Очікують результату', en: 'Awaiting result' },
  'analytics.noActive': { uk: 'Немає активних', en: 'No active' },
  'analytics.successful': { uk: 'Успішних записів', en: 'Successful' },
  'analytics.failed': { uk: 'Невдалих записів', en: 'Failed' },
  'analytics.edit': { uk: 'Редагувати', en: 'Edit' },
  'analytics.clearTitle': { uk: 'Очистити всі дані', en: 'Clear all data' },
  'analytics.clearConfirm': { uk: 'Ви впевнені, що хочете очистити всі дані аналітики? Ця дія незворотна.', en: 'Are you sure you want to clear all analytics data? This is irreversible.' },

  // ── Balance Tracker ──
  'balance.title': { uk: 'Трекер балансу', en: 'Balance Tracker' },
  'balance.bestResult': { uk: 'Найкращий результат', en: 'Best Result' },
  'balance.noCompleted': { uk: 'Поки немає завершених ставок', en: 'No completed bets yet' },
  'balance.atPeak': { uk: 'Банк на максимумі — це найкращий результат! 🔥', en: 'Bank at all-time high — best result! 🔥' },
  'balance.stable': { uk: 'Банк стабільний, близько до найкращого результату', en: 'Bank stable, close to best result' },
  'balance.dipping': { uk: 'Банк зменшився на', en: 'Bank down by' },
  'balance.dippingSuffix': { uk: 'від найкращого', en: 'from peak' },
  'balance.falling': { uk: 'Банк значно просів — на', en: 'Bank significantly down —' },
  'balance.fallingSuffix': { uk: 'від максимуму', en: 'from max' },
  'balance.adviceAdd': { uk: 'Додавай записи про ставки — цей блок покаже твій прогрес', en: 'Add bet records — this block will show your progress' },
  'balance.adviceGood': { uk: 'Ти на правильному шляху. Продовжуй!', en: 'You\'re on the right track. Keep going!' },
  'balance.adviceStable': { uk: 'Усе добре. Дотримуйся стратегії.', en: 'All good. Stick to your strategy.' },
  'balance.adviceDipping': { uk: 'Можливо варто зменшити ставки або зробити паузу', en: 'Consider reducing stakes or taking a break' },
  'balance.adviceFalling': { uk: 'Радимо зменшити ставки та переглянути стратегію', en: 'We recommend reducing stakes and reviewing your strategy' },
  'balance.bets': { uk: 'ставок', en: 'bets' },
  'balance.noData': { uk: 'Немає даних', en: 'No data' },
  'balance.viewOnPage': { uk: 'Дивитись на сторінці:', en: 'View on page:' },

  // ── MyBets ──
  'mybets.addRecord': { uk: 'Додати запис', en: 'Add Record' },
  'mybets.records': { uk: 'Останні записи', en: 'Recent Records' },
  'mybets.filter': { uk: 'Фільтр:', en: 'Filter:' },
  'mybets.today': { uk: 'Сьогодні', en: 'Today' },
  'mybets.allMatches': { uk: 'Всі матчі', en: 'All Matches' },
  'mybets.advanced': { uk: 'Розширені', en: 'Advanced' },
  'mybets.reset': { uk: 'Скинути', en: 'Reset' },
  'mybets.search': { uk: 'Пошук за матчем, командою, грою…', en: 'Search by match, team, game…' },
  'mybets.records1': { uk: 'запис', en: 'record' },
  'mybets.records2': { uk: 'записи', en: 'records' },
  'mybets.records3': { uk: 'записів', en: 'records' },
  'mybets.from': { uk: 'з', en: 'of' },
  'mybets.result': { uk: 'Результат:', en: 'Result:' },
  'mybets.period': { uk: 'Період:', en: 'Period:' },
  'mybets.all': { uk: 'Всі', en: 'All' },
  'mybets.win': { uk: 'Виграш', en: 'Win' },
  'mybets.loss': { uk: 'Програш', en: 'Loss' },
  'mybets.pending': { uk: 'Очікується', en: 'Pending' },
  'mybets.week': { uk: 'Тиждень', en: 'Week' },
  'mybets.month': { uk: 'Місяць', en: 'Month' },
  'mybets.quarter': { uk: 'Квартал', en: 'Quarter' },
  'mybets.sortDate': { uk: 'Дата', en: 'Date' },
  'mybets.sortProfit': { uk: 'Прибуток', en: 'Profit' },
  'mybets.sortOdds': { uk: 'Коефіцієнт', en: 'Odds' },
  'mybets.share': { uk: 'Поділитися', en: 'Share' },
  'mybets.details': { uk: 'Деталі', en: 'Details' },
  'mybets.delete': { uk: 'Видалити', en: 'Delete' },
  'mybets.deleteConfirm': { uk: 'Видалити ставку', en: 'Delete bet' },
  'mybets.deleteConfirmDesc': { uk: 'Ця дія незворотна.', en: 'This action is irreversible.' },
  'mybets.deleted': { uk: 'Ставку видалено', en: 'Bet deleted' },
  'mybets.noRecords': { uk: 'Поки немає записів про ставки', en: 'No bet records yet' },
  'mybets.noToday': { uk: 'Немає записів за сьогодні', en: 'No records today' },
  'mybets.noFilter': { uk: 'Немає записів за обраними фільтрами', en: 'No records matching filters' },

  // ── Profile ──
  'profile.title': { uk: 'Профіль', en: 'Profile' },
  'profile.yourBets': { uk: 'Ваші ставки', en: 'Your Bets' },
  'profile.riskyTeams': { uk: 'Ризикові команди', en: 'Risky Teams' },
  'profile.strategies': { uk: 'Стратегії', en: 'Strategies' },
  'profile.goals': { uk: 'Цілі', en: 'Goals' },
  'profile.backup': { uk: 'Бекап даних', en: 'Data Backup' },
  'profile.storageSize': { uk: 'Розмір даних у localStorage', en: 'Data size in localStorage' },
  'profile.storageDesc': { uk: 'Усі дані додатку зберігаються локально у вашому браузері', en: 'All app data is stored locally in your browser' },
  'profile.jsonExport': { uk: 'Повний бекап всіх даних', en: 'Full backup of all data' },
  'profile.jsonExportDesc': { uk: 'Експортує всі ваші дані (ставки, команди, стратегії, цілі, налаштування) в один JSON файл. Використовуйте для збереження копії або перенесення на інший пристрій.', en: 'Exports all your data (bets, teams, strategies, goals, settings) into one JSON file. Use to save a copy or transfer to another device.' },
  'profile.jsonBtn': { uk: 'Завантажити повний бекап', en: 'Download Full Backup' },
  'profile.jsonCreating': { uk: 'Створення бекапу...', en: 'Creating backup...' },
  'profile.csvExport': { uk: 'Експорт ставок у CSV', en: 'Export Bets to CSV' },
  'profile.csvExportDesc': { uk: 'Вивантажує ваші ставки у формат CSV для аналізу в Excel або Google Sheets.', en: 'Exports your bets in CSV format for analysis in Excel or Google Sheets.' },
  'profile.csvBtn': { uk: 'Завантажити CSV', en: 'Download CSV' },
  'profile.import': { uk: 'Відновити з бекапу', en: 'Restore from Backup' },
  'profile.importDesc': { uk: 'Завантажте раніше створений файл бекапу для відновлення всіх даних.', en: 'Upload a previously created backup file to restore all data.' },
  'profile.importBtn': { uk: 'Обрати файл бекапу', en: 'Choose backup file' },
  'profile.importWarning': { uk: 'Увага: відновлення з бекапу замінить усі поточні дані.', en: 'Warning: restoring from backup will replace all current data.' },
  'profile.noBetsForCsv': { uk: 'Немає ставок для експорту', en: 'No bets to export' },

  // ── Strategy ──
  'strategy.title': { uk: 'Стратегія', en: 'Strategy' },
  'strategy.strategies': { uk: 'Стратегії', en: 'Strategies' },
  'strategy.goals': { uk: 'Цілі', en: 'Goals' },
  'strategy.risks': { uk: 'Ризиковані команди', en: 'Risky Teams' },

  // ── Matches ──
  'matches.title': { uk: 'Матчі', en: 'Matches' },
  'matches.search': { uk: 'Пошук...', en: 'Search...' },
  'matches.liveCount': { uk: 'Live', en: 'Live' },

  // ── Landing ──
  'landing.login': { uk: 'Увійти', en: 'Log in' },
  'landing.tagline': { uk: 'Розумний беттінг з AI аналітикою', en: 'Smart betting with AI analytics' },

  // ── Login ──
  'login.title': { uk: 'Вхід', en: 'Login' },
  'login.username': { uk: 'Ім\'я користувача', en: 'Username' },
  'login.password': { uk: 'Пароль', en: 'Password' },
  'login.submit': { uk: 'Увійти', en: 'Log in' },
  'login.loading': { uk: 'Вхід...', en: 'Logging in...' },
  'login.error': { uk: 'Невірний логін або пароль', en: 'Invalid username or password' },

  // ── 404 ──
  '404.title': { uk: 'Сторінку не знайдено', en: 'Page Not Found' },
  '404.desc': { uk: 'Сторінка, яку ви шукаєте, не існує.', en: 'The page you\'re looking for doesn\'t exist.' },
  '404.back': { uk: 'На головну', en: 'Go Home' },

  // ── Common ──
  'common.currency': { uk: '₴', en: '₴' },
  'common.save': { uk: 'Зберегти', en: 'Save' },
  'common.cancel': { uk: 'Скасувати', en: 'Cancel' },
  'common.backupCreated': { uk: 'Повний бекап створено!', en: 'Full backup created!' },
  'common.backupError': { uk: 'Помилка створення бекапу', en: 'Backup creation error' },
  'common.csvExported': { uk: 'CSV експортовано!', en: 'CSV exported!' },
  'common.wrongFormat': { uk: 'Невірний формат файлу', en: 'Wrong file format' },
  'common.notBackup': { uk: 'Файл не є бекапом MatchIQ.', en: 'File is not a MatchIQ backup.' },
};

// ── Runtime helpers ──

type LangListener = (lang: Lang) => void;
const listeners = new Set<LangListener>();

let currentLang: Lang = (() => {
  try { return (localStorage.getItem('matchiq_lang') as Lang) || 'uk'; } catch { return 'uk'; }
})();

export function setLang(lang: Lang) {
  currentLang = lang;
  try { localStorage.setItem('matchiq_lang', lang); } catch { /* ignore */ }
  listeners.forEach(fn => fn(lang));
}

export function onLangChange(fn: LangListener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getLang(): Lang {
  return currentLang;
}

/**
 * Get a translated string.
 * Usage: t('nav.analytics') → 'Аналітика' | 'Analytics'
 */
export function t(key: string, fallback?: string): string {
  const entry = T[key];
  if (!entry) return fallback || key;
  return entry[currentLang] || entry['uk'] || fallback || key;
}

/**
 * React hook to subscribe to language changes.
 * Returns current language — re-renders component when language switches.
 */
export function useLang(): Lang {
  const [lang, setLangState] = useState<Lang>(currentLang);
  useEffect(() => onLangChange(setLangState), []);
  return lang;
}

/**
 * Plural-aware record count: tPlural(count, 'mybets.records1', 'mybets.records2', 'mybets.records3')
 * For English we always use plural, Ukrainian uses 1/2-4/5+ forms.
 */
export function tPlural(count: number, one: string, few: string, many: string): string {
  if (currentLang === 'en') return `${count} ${t(many)}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ${t(one)}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} ${t(few)}`;
  return `${count} ${t(many)}`;
}
