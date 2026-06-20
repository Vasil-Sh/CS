import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UserDataService } from '@/lib/userDataService';
import { useAuth } from '@/contexts/AuthContext';
import { logRender } from '@/lib/devLogger';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  ExternalLink,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  Save,
  X,
  Search,
  ArrowUpDown,
  Info,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Link
} from 'lucide-react';
import { CHART_CARD_SHADOW, CARD_BASE_STYLE, applyCardHover, resetCardHover } from '@/lib/cardStyles';

// ── Helpers ──

/** Convert any Telegram link to web preview URL (no account needed for public channels) */
function toWebPreviewUrl(link: string): string {
  if (!link) return '';
  // Already a /s/ link
  if (link.includes('/s/')) return link;
  // https://t.me/name → https://t.me/s/name
  return link.replace(/^(https?:\/\/)?t\.me\/(?!s\/)/, '$1t.me/s/');
}

/** Extract handle from Telegram link for display */
function tgHandle(link: string): string {
  if (!link) return '';
  const match = link.match(/t\.me\/(?:s\/)?([^/\s?#]+)/);
  return match ? '@' + match[1] : link;
}

// ── Smart Parser ──

interface ParsedBet {
  team1: string;
  team2: string;
  odds: string;
  match: string;
  prediction: 'team1' | 'team2' | null; // which team was picked
  confidence: string; // extracted confidence text like "уверен на 90%"
  notes: string; // remaining text
}

/** Try to extract betting info from a Telegram message */
function parseBetMessage(text: string): ParsedBet | null {
  if (!text.trim()) return null;

  let team1 = '';
  let team2 = '';
  let odds = '';
  let prediction: 'team1' | 'team2' | null = null;
  let confidence = '';

  // Strip emojis and extra whitespace for cleaner parsing
  const clean = text.replace(/[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}]/gu, '').trim();

  // Pattern 1: "Team1 vs Team2" or "Team1 - Team2" or "Team1 — Team2"
  let vsMatch = clean.match(/(.+?)\s+(?:vs\.?|VS\.?|против|—|–|-)\s+(.+)/i);
  if (!vsMatch) {
    // Pattern 2: "Team1 / Team2"
    vsMatch = clean.match(/(.+?)\s*\/\s*(.+)/);
  }
  if (!vsMatch) {
    // Pattern 3: Just two recognizable team names (capitalized words)
    vsMatch = clean.match(/([A-Z][\w\s.]{2,25}?)\s{2,}([A-Z][\w\s.]{2,25})/);
  }
  if (!vsMatch) {
    // Pattern 4: Newline-separated teams
    vsMatch = clean.match(/(.+)\n\s*\n(.+)/);
  }

  if (vsMatch) {
    team1 = vsMatch[1].trim();
    team2 = vsMatch[2].trim();
  }

  // Extract odds: any number like 1.85, 2.30, 3.5 near "кф", "коеф", "@", "odds:", etc.
  const oddsMatch = clean.match(/(?:кое?ф|odds?|@|кф\.?)\s*[:=]?\s*(\d+[.,]\d+)|\b(\d+[.,]\d{2})\b(?!\s*(?:%|процент|дней|днів|часов))/i);
  if (oddsMatch) {
    odds = (oddsMatch[1] || oddsMatch[2]).replace(',', '.');
  } else {
    // Try trailing number pattern like "... 1.85"
    const lastNum = clean.match(/(\d+[.,]\d{2})\s*$/);
    if (lastNum && parseFloat(lastNum[1]) >= 1.01 && parseFloat(lastNum[1]) <= 20) {
      odds = lastNum[1].replace(',', '.');
    }
  }

  // Detect prediction: which team is mentioned with "победа", "win", "ставка", "заход", "win", "п1", "п2", "фора"
  if (team1 && team2) {
    const afterVs = clean.substring(clean.indexOf(team2) + team2.length).toLowerCase();
    
    // Check for "П1" / "П2" markers
    if (/\bп1\b/.test(afterVs) || afterVs.includes(team1.toLowerCase())) {
      prediction = 'team1';
    } else if (/\bп2\b/.test(afterVs) || afterVs.includes(team2.toLowerCase())) {
      prediction = 'team2';
    }
  }

  // Detect confidence like "уверен на 85%", "🔥 90%", "confidence: 80%"
  const confMatch = clean.match(/(?:уверен|confidence|🔥|ув\.?)\D*(\d{1,3})\s*%/i);
  if (confMatch) {
    confidence = confMatch[0].trim();
  }

  // Build match string
  const match = team1 && team2 ? `${team1} vs ${team2}` : clean.substring(0, 80);

  return {
    team1,
    team2,
    odds,
    match,
    prediction,
    confidence,
    notes: clean.substring(0, 200),
  };
}

// ── Types ──

interface TelegramGroup {
  id: string;
  name: string;
  link: string;
  createdAt: string;
}

interface TelegramGroupBet {
  id: string;
  groupId: string;
  date: string;
  match: string;
  team1: string;
  team2: string;
  betType: string;
  odds: number;
  amount: number;
  result: 'Win' | 'Loss' | 'Pending';
  profit: number;
  notes: string;
  createdAt: number;
}

interface GroupStats {
  groupId: string;
  groupName: string;
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  totalProfit: number;
  winRate: number;
  roi: number;
  stability: number;       // 0-100 stability score
  stabilityLabel: string;   // "Стабільна" / "Хитка" / "Нестабільна" / "Немає даних"
  streak: number;           // current W/L streak (positive=wins, negative=losses)
  monthlyProfit: { month: string; profit: number }[];
}

// ── Empty templates ──

const EMPTY_GROUP: Omit<TelegramGroup, 'id' | 'createdAt'> = { name: '', link: '' };

const EMPTY_BET: Omit<TelegramGroupBet, 'id' | 'createdAt'> = {
  groupId: '',
  date: new Date().toISOString().split('T')[0],
  match: '',
  team1: '',
  team2: '',
  betType: 'Ординар',
  odds: 0,
  amount: 0,
  result: 'Pending',
  profit: 0,
  notes: '',
};

// ── Component ──

export default function TelegramGroups() {
  logRender('TelegramGroups');
  const { user } = useAuth();
  const currentUser = user?.username || '';

  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [bets, setBets] = useState<TelegramGroupBet[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load user data when username becomes available
  useEffect(() => {
    if (!currentUser || dataLoaded) return;
    setGroups(UserDataService.getUserData<TelegramGroup[]>(currentUser, 'tg_groups', []));
    setBets(UserDataService.getUserData<TelegramGroupBet[]>(currentUser, 'tg_bets', []));
    setDataLoaded(true);
  }, [currentUser, dataLoaded]);

  // Reload when username changes (logout/login)
  useEffect(() => {
    setDataLoaded(false);
  }, [currentUser]);

  // Refs for immediate save (avoid effect delay on navigation)
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const betsRef = useRef(bets);
  betsRef.current = bets;

  // Persist — write immediately when data changes (ref-based for navigation safety)
  useEffect(() => {
    if (!currentUser || !dataLoaded) return;
    UserDataService.setUserDataSync(currentUser, 'tg_groups', groups);
  }, [groups, currentUser, dataLoaded]);
  useEffect(() => {
    if (!currentUser || !dataLoaded) return;
    UserDataService.setUserDataSync(currentUser, 'tg_bets', bets);
  }, [bets, currentUser, dataLoaded]);

  // Dialogs
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TelegramGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ ...EMPTY_GROUP });
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<string | null>(null);

  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<TelegramGroupBet | null>(null);
  const [betForm, setBetForm] = useState({ ...EMPTY_BET });

  // Quick Parse
  const [quickParseText, setQuickParseText] = useState('');
  const [quickParseOpen, setQuickParseOpen] = useState(false);

  // Filters & sort
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'odds' | 'profit'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ── Group CRUD ──

  const handleSaveGroup = () => {
    if (!groupForm.name.trim()) {
      toast.error('Введіть назву групи');
      return;
    }

    let newGroups: TelegramGroup[];
    if (editingGroup) {
      newGroups = groupsRef.current.map(g => g.id === editingGroup.id
        ? { ...g, name: groupForm.name.trim(), link: groupForm.link.trim() }
        : g
      );
      toast.success('Групу оновлено');
    } else {
      const newGroup: TelegramGroup = {
        id: crypto.randomUUID(),
        name: groupForm.name.trim(),
        link: groupForm.link.trim(),
        createdAt: new Date().toISOString(),
      };
      newGroups = [...groupsRef.current, newGroup];
      toast.success('Групу додано!');
    }
    setGroups(newGroups);
    if (currentUser) UserDataService.setUserDataSync(currentUser, 'tg_groups', newGroups);

    setGroupDialogOpen(false);
    setEditingGroup(null);
    setGroupForm({ ...EMPTY_GROUP });
  };

  const handleDeleteGroup = (groupId: string) => {
    const newGroups = groupsRef.current.filter(g => g.id !== groupId);
    const newBets = betsRef.current.filter(b => b.groupId !== groupId);
    setGroups(newGroups);
    setBets(newBets);
    if (currentUser) {
      UserDataService.setUserDataSync(currentUser, 'tg_groups', newGroups);
      UserDataService.setUserDataSync(currentUser, 'tg_bets', newBets);
    }
    toast.success('Групу та її ставки видалено');
    setDeleteGroupConfirm(null);
  };

  const openEditGroup = (group: TelegramGroup) => {
    setEditingGroup(group);
    setGroupForm({ name: group.name, link: group.link });
    setGroupDialogOpen(true);
  };

  // ── Bet CRUD ──

  const handleSaveBet = () => {
    if (!betForm.groupId) {
      toast.error('Оберіть групу');
      return;
    }
    if (!betForm.match.trim()) {
      toast.error('Введіть назву матчу');
      return;
    }
    if (!betForm.odds || betForm.odds <= 0) {
      toast.error('Введіть коефіцієнт');
      return;
    }

    let newBets: TelegramGroupBet[];
    if (editingBet) {
      newBets = betsRef.current.map(b => b.id === editingBet.id
        ? { ...betForm, id: editingBet.id, createdAt: editingBet.createdAt }
        : b
      );
      toast.success('Ставку оновлено');
    } else {
      const newBet: TelegramGroupBet = {
        ...betForm,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      newBets = [...betsRef.current, newBet];
      toast.success('Ставку додано!');
    }
    setBets(newBets);
    if (currentUser) UserDataService.setUserDataSync(currentUser, 'tg_bets', newBets);

    setBetDialogOpen(false);
    setEditingBet(null);
    setBetForm({ ...EMPTY_BET, date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteBet = (betId: string) => {
    const newBets = betsRef.current.filter(b => b.id !== betId);
    setBets(newBets);
    if (currentUser) UserDataService.setUserDataSync(currentUser, 'tg_bets', newBets);
    toast.success('Ставку видалено');
  };

  const openEditBet = (bet: TelegramGroupBet) => {
    setEditingBet(bet);
    setBetForm({
      groupId: bet.groupId,
      date: bet.date,
      match: bet.match,
      team1: bet.team1,
      team2: bet.team2,
      betType: bet.betType,
      odds: bet.odds,
      amount: bet.amount,
      result: bet.result,
      profit: bet.profit,
      notes: bet.notes,
    });
    setBetDialogOpen(true);
  };

  const openAddBet = (groupId?: string) => {
    setEditingBet(null);
    setBetForm({ ...EMPTY_BET, groupId: groupId || '', date: new Date().toISOString().split('T')[0] });
    setQuickParseText('');
    setQuickParseOpen(false);
    setBetDialogOpen(true);
  };

  const handleQuickParse = () => {
    const parsed = parseBetMessage(quickParseText);
    if (!parsed) {
      toast.warning('Не вдалося розпізнати ставку', { description: 'Спробуйте скопіювати повідомлення повністю або заповнити форму вручну' });
      return;
    }
    setBetForm(p => ({
      ...p,
      match: parsed.match,
      team1: parsed.team1,
      team2: parsed.team2,
      odds: parsed.odds ? parseFloat(parsed.odds) : p.odds,
    }));
    if (parsed.confidence) {
      setBetForm(p => ({ ...p, notes: `[Авто] ${parsed.confidence} — ${parsed.notes.substring(0, 80)}` }));
    }
    toast.success('Ставку розпізнано!', { description: parsed.match && parsed.odds ? `${parsed.match} @ ${parsed.odds}` : 'Перевірте заповнені поля' });
  };

  // ── Stats calculation ──

  const groupStats = useMemo((): GroupStats[] => {
    return groups.map(group => {
      const groupBets = bets.filter(b => b.groupId === group.id);
      const completed = groupBets.filter(b => b.result !== 'Pending');
      const wins = completed.filter(b => b.result === 'Win').length;
      const losses = completed.filter(b => b.result === 'Loss').length;
      const totalProfit = groupBets.reduce((sum, b) => sum + (b.profit || 0), 0);
      const totalStake = groupBets.reduce((sum, b) => sum + (b.amount || 0), 0);
      const winRate = completed.length > 0 ? (wins / completed.length) * 100 : 0;
      const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;

      // Stability score: standard deviation of per-bet profit, lower = more stable
      const profits = completed.map(b => b.profit || 0);
      const avgProfit = profits.length > 0 ? profits.reduce((s, v) => s + v, 0) / profits.length : 0;
      const variance = profits.length > 1
        ? profits.reduce((s, v) => s + Math.pow(v - avgProfit, 2), 0) / profits.length
        : 0;
      const stdDev = Math.sqrt(variance);
      const stability = profits.length >= 5
        ? Math.max(0, Math.min(100, 100 - (stdDev / (Math.abs(avgProfit) + 1)) * 20))
        : profits.length > 0 ? 60 : 0;
      const stabilityLabel = profits.length < 3 ? 'Немає даних'
        : stability >= 70 ? 'Стабільна'
        : stability >= 40 ? 'Хитка'
        : 'Нестабільна';

      // Current streak
      const sortedByDate = [...completed].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      let streak = 0;
      for (const b of sortedByDate) {
        if (b.result === 'Win') {
          if (streak >= 0) streak++;
          else break;
        } else {
          if (streak <= 0) streak--;
          else break;
        }
      }

      // Monthly profit
      const monthlyMap: Record<string, number> = {};
      groupBets.forEach(b => {
        const m = b.date.slice(0, 7); // YYYY-MM
        monthlyMap[m] = (monthlyMap[m] || 0) + (b.profit || 0);
      });
      const monthlyProfit = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, profit]) => ({ month: month.slice(5) + '/' + month.slice(2, 4), profit }));

      return {
        groupId: group.id,
        groupName: group.name,
        totalBets: groupBets.length,
        wins,
        losses,
        pending: groupBets.length - wins - losses,
        totalProfit,
        winRate,
        roi,
        stability,
        stabilityLabel,
        streak,
        monthlyProfit,
      };
    });
  }, [groups, bets]);

  const rankedGroups = useMemo(() => {
    return [...groupStats].sort((a, b) => {
      // Composite score: 40% winRate + 30% roi + 20% stability + 10% profit
      const scoreA = (a.winRate * 0.4) + (Math.min(a.roi, 100) * 0.3) + (a.stability * 0.2) + (Math.min(a.totalProfit, 10000) / 100 * 0.1);
      const scoreB = (b.winRate * 0.4) + (Math.min(b.roi, 100) * 0.3) + (b.stability * 0.2) + (Math.min(b.totalProfit, 10000) / 100 * 0.1);
      return scoreB - scoreA;
    }).map((gs, idx) => ({ ...gs, rank: idx + 1 }));
  }, [groupStats]);

  const overallStats = useMemo(() => {
    const total = bets.length;
    const completed = bets.filter(b => b.result !== 'Pending');
    const wins = completed.filter(b => b.result === 'Win').length;
    const totalProfit = bets.reduce((s, b) => s + (b.profit || 0), 0);
    const totalStake = bets.reduce((s, b) => s + (b.amount || 0), 0);
    return {
      totalBets: total,
      wins,
      losses: completed.length - wins,
      pending: total - completed.length,
      totalProfit,
      winRate: completed.length > 0 ? (wins / completed.length) * 100 : 0,
      roi: totalStake > 0 ? (totalProfit / totalStake) * 100 : 0,
    };
  }, [bets]);

  // ── Filtered bets ──

  const filteredBets = useMemo(() => {
    let result = bets;
    if (selectedGroupFilter !== 'all') {
      result = result.filter(b => b.groupId === selectedGroupFilter);
    }
    if (resultFilter !== 'all') {
      result = result.filter(b => b.result === resultFilter);
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'odds') cmp = a.odds - b.odds;
      if (sortBy === 'profit') cmp = (a.profit || 0) - (b.profit || 0);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [bets, selectedGroupFilter, resultFilter, sortBy, sortOrder]);

  const getGroupName = (groupId: string) => groups.find(g => g.id === groupId)?.name || '—';

  const resultBadge = (result: string) => {
    switch (result) {
      case 'Win': return <Badge className="bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] text-xs font-medium rounded-full"><CheckCircle2 className="h-3 w-3 mr-1" strokeWidth={1.5} />Виграш</Badge>;
      case 'Loss': return <Badge className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-xs font-medium rounded-full"><XCircle className="h-3 w-3 mr-1" strokeWidth={1.5} />Програш</Badge>;
      default: return <Badge className="bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] text-xs font-medium rounded-full"><Clock className="h-3 w-3 mr-1" strokeWidth={1.5} />Очікує</Badge>;
    }
  };

  // ── Shared UI ──
  const renderDialogs = () => (
    <>
      {/* ===== Group Dialog ===== */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Редагувати групу' : 'Нова Telegram-група'}</DialogTitle>
            <DialogDescription>
              Додайте групу з якої будете аналізувати ставки
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Назва групи *</Label>
              <Input
                value={groupForm.name}
                onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Pro Betting 🇺🇦"
                className="rounded-xl border-[#E5E7EB]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Посилання</Label>
              <Input
                value={groupForm.link}
                onChange={e => setGroupForm(p => ({ ...p, link: e.target.value }))}
                placeholder="https://t.me/groupname"
                className="rounded-xl border-[#E5E7EB]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)} className="rounded-xl">Скасувати</Button>
            <Button onClick={handleSaveGroup} className="rounded-xl bg-[#447afc] hover:bg-[#3568d4]">
              <Save className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
              {editingGroup ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Bet Dialog ===== */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBet ? 'Редагувати ставку' : 'Нова ставка з Telegram'}</DialogTitle>
            <DialogDescription>
              Додайте інформацію про ставку з Telegram-групи
            </DialogDescription>
          </DialogHeader>

          {/* Quick Parse — only for new bets, not edits */}
          {!editingBet && (
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setQuickParseOpen(!quickParseOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${quickParseOpen ? 'bg-[#EFF6FF] text-[#447afc]' : 'bg-[#F9FAFB] text-[#6B7280] hover:bg-[#F3F4F6]'}`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  Швидке розпізнавання (Quick Parse)
                </span>
                <span className="text-xs text-[#9CA3AF]">{quickParseOpen ? 'Згорнути' : 'Розгорнути'}</span>
              </button>
              {quickParseOpen && (
                <div className="px-4 py-3 space-y-2 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#9CA3AF]">
                    Вставте текст ставки з Telegram-каналу — система автоматично розпізнає команди, коефіцієнт та прогноз.
                  </p>
                  <textarea
                    value={quickParseText}
                    onChange={e => setQuickParseText(e.target.value)}
                    placeholder={`Наприклад:\nNaVi vs FaZe @ 1.85\nСтавка на NaVi — уверен на 80%\n...або будь-який інший формат`}
                    rows={4}
                    className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#447afc] focus:ring-1 focus:ring-[#447afc] outline-none resize-none"
                  />
                  <Button
                    type="button"
                    onClick={handleQuickParse}
                    disabled={!quickParseText.trim()}
                    className="w-full rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                    Розпізнати ставку
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Група *</Label>
              <Select value={betForm.groupId} onValueChange={v => setBetForm(p => ({ ...p, groupId: v }))}>
                <SelectTrigger className="rounded-xl border-[#E5E7EB]">
                  <SelectValue placeholder="Оберіть групу" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Дата</Label>
              <Input
                type="date"
                value={betForm.date}
                onChange={e => setBetForm(p => ({ ...p, date: e.target.value }))}
                className="rounded-xl border-[#E5E7EB]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Матч *</Label>
                <Input
                  value={betForm.match}
                  onChange={e => setBetForm(p => ({ ...p, match: e.target.value }))}
                  placeholder="NaVi vs FaZe"
                  className="rounded-xl border-[#E5E7EB]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Тип ставки</Label>
                <Select value={betForm.betType} onValueChange={v => setBetForm(p => ({ ...p, betType: v }))}>
                  <SelectTrigger className="rounded-xl border-[#E5E7EB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ординар">Ординар</SelectItem>
                    <SelectItem value="Експрес">Експрес</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Команда 1</Label>
                <Input
                  value={betForm.team1}
                  onChange={e => setBetForm(p => ({ ...p, team1: e.target.value }))}
                  className="rounded-xl border-[#E5E7EB]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Команда 2</Label>
                <Input
                  value={betForm.team2}
                  onChange={e => setBetForm(p => ({ ...p, team2: e.target.value }))}
                  className="rounded-xl border-[#E5E7EB]"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Коефіцієнт *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={betForm.odds || ''}
                  onChange={e => setBetForm(p => ({ ...p, odds: parseFloat(e.target.value) || 0 }))}
                  className="rounded-xl border-[#E5E7EB]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Сума</Label>
                <Input
                  type="number"
                  value={betForm.amount || ''}
                  onChange={e => setBetForm(p => ({ ...p, amount: parseInt(e.target.value) || 0 }))}
                  className="rounded-xl border-[#E5E7EB]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Прибуток</Label>
                <Input
                  type="number"
                  value={betForm.profit || ''}
                  onChange={e => setBetForm(p => ({ ...p, profit: parseInt(e.target.value) || 0 }))}
                  className="rounded-xl border-[#E5E7EB]"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Результат</Label>
              <Select value={betForm.result} onValueChange={v => setBetForm(p => ({ ...p, result: v as TelegramGroupBet['result'] }))}>
                <SelectTrigger className="rounded-xl border-[#E5E7EB]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Win">Виграш</SelectItem>
                  <SelectItem value="Loss">Програш</SelectItem>
                  <SelectItem value="Pending">Очікує</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Нотатки</Label>
              <Input
                value={betForm.notes}
                onChange={e => setBetForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Додаткові нотатки..."
                className="rounded-xl border-[#E5E7EB]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBetDialogOpen(false)} className="rounded-xl">Скасувати</Button>
            <Button onClick={handleSaveBet} className="rounded-xl bg-[#447afc] hover:bg-[#3568d4]">
              <Save className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
              {editingBet ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Group Confirm ===== */}
      <Dialog open={!!deleteGroupConfirm} onOpenChange={() => setDeleteGroupConfirm(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Видалити групу?</DialogTitle>
            <DialogDescription>
              Усі ставки цієї групи також будуть видалені. Ця дія незворотна.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGroupConfirm(null)} className="rounded-xl">Скасувати</Button>
            <Button
              onClick={() => deleteGroupConfirm && handleDeleteGroup(deleteGroupConfirm)}
              className="rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            >
              <Trash2 className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // ── Render ──

  const renderKPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <StatCard label="Груп" value={groups.length} icon={Users} color="bg-[#EFF6FF]" iconColor="text-[#447afc]" />
      <StatCard label="Ставок" value={overallStats.totalBets} icon={BarChart3} color="bg-[#F0FDF4]" iconColor="text-[#16A34A]" />
      <StatCard 
        label="Win Rate" 
        value={`${overallStats.winRate.toFixed(0)}%`} 
        icon={overallStats.winRate >= 50 ? TrendingUp : TrendingDown} 
        color="bg-[#FEF3C7]" 
        iconColor={overallStats.winRate >= 50 ? 'text-[#16A34A]' : 'text-[#DC2626]'}
      />
      <StatCard 
        label="Прибуток" 
        value={`${overallStats.totalProfit >= 0 ? '+' : ''}${overallStats.totalProfit.toFixed(0)}`} 
        icon={Target} 
        color="bg-[#F0FDF4]" 
        iconColor={overallStats.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}
      />
    </div>
  );

  // ── Render ──

  if (!currentUser) return null;

  return (
    <>
      {renderDialogs()}
      <div className="flex flex-col flex-1 min-h-0 space-y-6">
      {/* ===== KPI Cards — always visible ===== */}
      {renderKPICards()}

      {/* ===== Bot Setup (admin only) ===== */}
      <BotSetup />

      {groups.length === 0 ? (
        <Card className="border-2 border-[#D1D5DB] rounded-2xl bg-white overflow-hidden flex-1 flex items-center justify-center" style={{ boxShadow: CHART_CARD_SHADOW }}>
          <CardContent className="py-16 text-center">
            <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
              <MessageCircle className="h-16 w-16 text-[#9CA3AF]" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-[#111827] mb-2">
              Немає доданих Telegram-груп
            </h3>
            <p className="text-[#6B7280] text-sm mb-6">
              Додайте Telegram-групи зі ставками для аналізу їх результатів
            </p>
            <Button
              onClick={() => { setEditingGroup(null); setGroupForm({ ...EMPTY_GROUP }); setGroupDialogOpen(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Додати групу
            </Button>
          </CardContent>
        </Card>
      ) : (
      <>
      {/* ===== Cards View ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rankedGroups.map((gs, idx) => (
          <div
            key={gs.groupId}
            className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl h-full flex flex-col overflow-hidden transition-all duration-300"
            style={CARD_BASE_STYLE}
            onMouseEnter={(e) => applyCardHover(e.currentTarget)}
            onMouseLeave={(e) => resetCardHover(e.currentTarget)}
          >
            {/* Header: icon + name */}
            <div className="px-7 pt-7 pb-5">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#EFF6FF] flex-shrink-0 mt-0.5">
                  <MessageCircle className="h-5 w-5 text-[#447afc]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1 min-h-[3.5rem] flex flex-col justify-center">
                  <h4 className="text-xl font-bold text-[#374151] tracking-tight line-clamp-2">{gs.groupName}</h4>
                  {gs.totalBets > 0 && (
                    <div className="mt-1.5">
                      <StabilityBadge stability={gs.stability} label={gs.stabilityLabel} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider 1 */}
            <div className="h-px w-full bg-[#F3F4F6]" />

            {/* Link section */}
            {(() => {
              const g = groups.find(x => x.id === gs.groupId);
              return g?.link ? (
                <div className="px-7 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#F0FDF4] flex-shrink-0">
                      <ExternalLink className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
                    </div>
                    <a href={g.link} target="_blank" rel="noopener noreferrer" className="text-sm text-[#447afc] hover:underline truncate flex-1">
                      {tgHandle(g.link)}
                    </a>
                    <a
                      href={toWebPreviewUrl(g.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-white bg-[#447afc] hover:bg-[#3568d4] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      title="Переглянути канал без Telegram"
                    >
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Перегляд
                    </a>
                  </div>
                </div>
              ) : (
                <div className="px-7 py-4" /> /* empty space for alignment */
              );
            })()}

            {/* Divider 2 */}
            <div className="h-px w-full bg-[#F3F4F6]" />

            {/* Content */}
            <div className="space-y-4 flex-1 px-7 pb-7 pt-6">
              {/* Streak indicator */}
              {gs.streak !== 0 && (
                <p className={`text-sm font-medium ${gs.streak > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {gs.streak > 0 ? '🔥' : '📉'} {Math.abs(gs.streak)} {gs.streak > 0 ? 'виграшів' : 'програшів'} поспіль
                </p>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center">
                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ставок</p>
                  <p className="text-2xl font-bold text-[#111827] mt-1.5">{gs.totalBets}</p>
                </div>
                <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center">
                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Виграшів</p>
                  <p className="text-2xl font-bold text-[#16A34A] mt-1.5">{gs.wins}</p>
                </div>
                <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center">
                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Win Rate</p>
                  <p className={`text-2xl font-bold mt-1.5 ${gs.winRate >= 50 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {gs.winRate.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Monthly mini-chart */}
              {gs.monthlyProfit.length > 0 && (
                <div>
                  <div className="flex items-end gap-[3px] h-10">
                    {gs.monthlyProfit.map((m, i) => {
                      const maxVal = Math.max(...gs.monthlyProfit.map(x => Math.abs(x.profit)), 1);
                      const height = Math.max(4, (Math.abs(m.profit) / maxVal) * 100);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${m.month}: ${m.profit >= 0 ? '+' : ''}${m.profit.toFixed(0)} ₴`}>
                          <div
                            className={`w-full rounded-t-sm transition-all ${m.profit >= 0 ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`}
                            style={{ height: `${height}%`, minHeight: m.profit !== 0 ? 3 : 1 }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {gs.monthlyProfit.map((m, i) => (
                      <span key={i} className="text-[9px] text-[#9CA3AF]">{m.month}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Profit row with dividers */}
              <div className="-mx-7">
                <div className="h-px w-full bg-[#F3F4F6]" />
                <div className="flex items-center justify-between px-7 py-4">
                  <span className="text-base font-bold text-[#111827]">Прибуток</span>
                  <span className={`text-xl font-bold ${gs.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {gs.totalProfit >= 0 ? '+' : ''}{gs.totalProfit.toFixed(0)} ₴
                  </span>
                </div>
                <div className="h-px w-full bg-[#F3F4F6]" />
              </div>

              {/* Bottom row: add bet + edit/delete */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => openAddBet(gs.groupId)}
                  className="flex-1 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-sm font-semibold transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
                  Додати ставку
                </Button>
                <button
                  onClick={() => {
                    const g = groups.find(x => x.id === gs.groupId);
                    if (g) openEditGroup(g);
                  }}
                  className="p-2 rounded-xl border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#111827] transition-colors flex-shrink-0"
                  title="Редагувати групу"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setDeleteGroupConfirm(gs.groupId)}
                  className="p-2 rounded-xl border border-[#FEE2E2] hover:bg-[#FEF2F2] text-[#EF4444] hover:text-[#DC2626] transition-colors flex-shrink-0"
                  title="Видалити групу"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Group Card */}
        <button
          onClick={() => { setEditingGroup(null); setGroupForm({ ...EMPTY_GROUP }); setGroupDialogOpen(true); }}
          className="border-2 border-dashed border-[#D1D5DB] rounded-3xl bg-white/50 hover:bg-[#F9FAFB] hover:border-[#9CA3AF] transition-all duration-300 p-5 flex flex-col items-center justify-center gap-2 min-h-[200px] cursor-pointer h-full"
        >
          <div className="p-3 bg-[#F3F4F6] rounded-full">
            <Plus className="h-5 w-5 text-[#9CA3AF]" strokeWidth={2} />
          </div>
          <span className="text-sm font-medium text-[#9CA3AF]">Додати групу</span>
        </button>
      </div>

      {/* ===== Bets Table ===== */}
      {bets.length > 0 && (
        <Card className="border border-[#F3F4F6] rounded-2xl bg-white overflow-hidden" style={{ boxShadow: CHART_CARD_SHADOW }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-[#111827]">
                Ставки з Telegram <span className="text-[#9CA3AF] font-normal">({filteredBets.length})</span>
              </h3>
              <div className="flex items-center gap-2">
                <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
                  <SelectTrigger className="w-[160px] h-9 rounded-xl border-[#E5E7EB] text-xs">
                    <SelectValue placeholder="Всі групи" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі групи</SelectItem>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={resultFilter} onValueChange={setResultFilter}>
                  <SelectTrigger className="w-[130px] h-9 rounded-xl border-[#E5E7EB] text-xs">
                    <SelectValue placeholder="Всі результати" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі</SelectItem>
                    <SelectItem value="Win">Виграш</SelectItem>
                    <SelectItem value="Loss">Програш</SelectItem>
                    <SelectItem value="Pending">Очікує</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddBet()}
                  className="rounded-xl border-[#E5E7EB] hover:border-[#D1D5DB] text-[#6B7280] hover:text-[#111827] text-xs font-medium"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                  Додати
                </Button>
              </div>
            </div>

            {filteredBets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F3F4F6]">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Група</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Дата</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Матч</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Коеф.</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Сума</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Рез-т</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Прибуток</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBets.map(bet => (
                      <tr key={bet.id} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="text-xs font-medium text-[#111827]">{getGroupName(bet.groupId)}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs text-[#6B7280]">
                            {new Date(bet.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs font-medium text-[#111827]">
                            {bet.match || (bet.team1 && bet.team2 ? `${bet.team1} vs ${bet.team2}` : '—')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-xs font-semibold text-[#111827]">{bet.odds}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-xs text-[#6B7280]">{bet.amount > 0 ? bet.amount : '—'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">{resultBadge(bet.result)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`text-xs font-semibold ${(bet.profit || 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                            {(bet.profit || 0) >= 0 ? '+' : ''}{(bet.profit || 0).toFixed(0)}
                          </span>
                        </td>
                        <td className="py-2.5 px-1">
                          <div className="flex gap-0.5">
                            <button
                              onClick={() => openEditBet(bet)}
                              className="p-1 rounded-md hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#111827] transition-colors"
                              title="Редагувати"
                            >
                              <Pencil className="h-3 w-3" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => handleDeleteBet(bet.id)}
                              className="p-1 rounded-md hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                              title="Видалити"
                            >
                              <X className="h-3 w-3" strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-[#9CA3AF]">Немає ставок за обраними фільтрами</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

        </>
      )}
    </div>
    </>
  );
}

// ── Stability Badge ──

function StabilityBadge({ stability, label }: { stability: number; label: string }) {
  const icon = stability >= 70 ? ShieldCheck : stability >= 40 ? Shield : ShieldAlert;
  const colors = stability >= 70
    ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
    : stability >= 40
    ? 'bg-[#FEF3C7] text-[#D97706] border-[#FED7AA]'
    : label === 'Немає даних'
    ? 'bg-[#F3F4F6] text-[#9CA3AF] border-[#E5E7EB]'
    : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';

  return (
    <Badge className={`text-[10px] font-medium px-2 py-0.5 border rounded-full ${colors}`}>
      <Icon className="h-3 w-3 mr-1" strokeWidth={1.5} />
      {label}
    </Badge>
  );
}

// ── Mini Stat Card ──

function StatCard({ label, value, icon: Icon, color, iconColor }: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  iconColor: string;
}) {
  return (
    <div
      className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 flex flex-col justify-between transition-all duration-300"
      style={CARD_BASE_STYLE}
      onMouseEnter={(e) => applyCardHover(e.currentTarget)}
      onMouseLeave={(e) => resetCardHover(e.currentTarget)}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${color}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.5} />
        </div>
        <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-[#111827] tracking-tight">{value}</p>
    </div>
  );
}

// ── Bot Setup Panel ──

function BotSetup() {
  const [open, setOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('tg_bot_webhook_url') || '');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (webhookUrl) localStorage.setItem('tg_bot_webhook_url', webhookUrl);
  }, [webhookUrl]);

  // Only show to admins
  if (!isAdmin) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-6">
      <Card className="border border-[#F3F4F6] rounded-2xl bg-white overflow-hidden" style={{ boxShadow: CHART_CARD_SHADOW }}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB] transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EFF6FF]">
                <MessageCircle className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-[#111827]">Telegram Bot (автоматичний збір)</h4>
                <p className="text-xs text-[#9CA3AF]">Налаштуйте бота для автоматичного парсингу ставок з груп</p>
              </div>
            </div>
            {open ? (
              <ChevronUp className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-4 border-t border-[#F3F4F6] pt-4">
            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#447afc] text-white text-xs font-bold flex-shrink-0">1</span>
                <p className="text-sm font-medium text-[#111827]">Створіть бота через @BotFather у Telegram</p>
              </div>
              <p className="text-xs text-[#6B7280] ml-8">
                Напишіть <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">/newbot</code> → оберіть назву → скопіюйте <strong>API Token</strong>
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#447afc] text-white text-xs font-bold flex-shrink-0">2</span>
                <p className="text-sm font-medium text-[#111827]">Розгорніть Google Apps Script</p>
              </div>
              <p className="text-xs text-[#6B7280] ml-8">
                Код знаходиться у файлі <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">apps-script/telegram-bot.gs</code> у вашому репозиторії.
              </p>
              <div className="ml-8 space-y-1">
                <p className="text-xs text-[#6B7280]">1. Відкрийте <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-[#447afc] hover:underline">Google Apps Script</a></p>
                <p className="text-xs text-[#6B7280]">2. Вставте код з <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">telegram-bot.gs</code></p>
                <p className="text-xs text-[#6B7280]">3. Замініть <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">YOUR_BOT_TOKEN_HERE</code> на ваш токен</p>
                <p className="text-xs text-[#6B7280]">4. Натисніть <strong>Deploy → New Deployment → Web App</strong></p>
                <p className="text-xs text-[#6B7280]">5. Скопіюйте <strong>Deployment URL</strong> і вставте нижче</p>
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Webhook URL (Deployment URL)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/..."
                  className="flex-1 rounded-xl border-[#E5E7EB] text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(webhookUrl).then(() => toast.success('URL скопійовано!')); }}
                  className="rounded-xl border-[#E5E7EB] text-xs flex-shrink-0"
                >
                  <Link className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
                  Копіювати
                </Button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#447afc] text-white text-xs font-bold flex-shrink-0">3</span>
                <p className="text-sm font-medium text-[#111827]">Додайте бота в групи як адміністратора</p>
              </div>
              <p className="text-xs text-[#6B7280] ml-8">
                Перейдіть у кожну Telegram-групу → <strong>Add Member</strong> → знайдіть вашого бота → <strong>Make Admin</strong>. Бот почне автоматично отримувати повідомлення та парсити ставки.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#447afc] text-white text-xs font-bold flex-shrink-0">4</span>
                <p className="text-sm font-medium text-[#111827]">Запустіть setup() в Apps Script</p>
              </div>
              <p className="text-xs text-[#6B7280] ml-8">
                У редакторі Apps Script виберіть функцію <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">setup</code> і натисніть <strong>Run</strong>. Це налаштує вебхук для бота.
              </p>
            </div>

            <div className="p-4 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] mt-4">
              <p className="text-sm font-medium text-[#16A34A] mb-1">✅ Бот налаштовано?</p>
              <p className="text-xs text-[#6B7280]">
                Ставки автоматично з'являтимуться в Google Sheets (USDT лист).
                Сирі повідомлення зберігаються в листі <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">TG_Raw</code> для перевірки.
                Для тестування парсингу запустіть <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">testParse()</code> у Apps Script.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
