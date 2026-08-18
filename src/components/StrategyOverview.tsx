import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CS2Strategy } from "@/types/strategy";
import { api } from "@/lib/apiClient";
import { AlertTriangle, Plus, Trash2, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/appStore";
import { useAuth } from "@/contexts/AuthContext";
import { UserDataService } from "@/lib/userDataService";
import { logRender } from "@/lib/devLogger";
import { getRiskColor, getRiskIcon, parseCriteriaForValidation } from "@/lib/strategyHelpers";
import StrategyTabNav from "@/components/strategy/StrategyTabNav";
import StrategyEmptyState from "@/components/strategy/StrategyEmptyState";
import StrategyLoadingSkeleton from "@/components/strategy/StrategyLoadingSkeleton";
import StrategyFilters from "@/components/strategy/StrategyFilters";
import StrategyCard from "@/components/strategy/StrategyCard";
import StrategyOverallStats from "@/components/strategy/StrategyOverallStats";
import StrategyTopRoiList from "@/components/strategy/StrategyTopRoiList";
import StrategyRecommendations from "@/components/strategy/StrategyRecommendations";
import StrategyPerformanceCharts from "@/components/strategy/StrategyPerformanceCharts";
import CreateStrategyDialog from "@/components/strategy/CreateStrategyDialog";
import StrategySuccessDialog from "@/components/strategy/StrategySuccessDialog";
import StrategyDetailsDialog from "@/components/strategy/StrategyDetailsDialog";

interface StrategyStats { totalBets: number; wins: number; losses: number; pending: number; totalProfit: number; totalStake: number; winRate: number; roi: number; }
interface StrategyTemplate { name: string; description: string; riskLevel: "Low" | "Medium" | "High"; expectedROI: number; criteria: string[]; }

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  { name: "Консервативна стратегія", description: "Безпечний підхід з низьким ризиком.", riskLevel: "Low", expectedROI: 8, criteria: ["Мінімальний коефіцієнт 1.3", "Максимальний коефіцієнт 1.8", "Формат тільки BO3", "Тільки ординари"] },
  { name: "Збалансована стратегія", description: "Оптимальне співвідношення ризику та прибутку.", riskLevel: "Medium", expectedROI: 15, criteria: ["Мінімальний коефіцієнт 1.5", "Максимальний коефіцієнт 2.5", "Формат BO1 та BO3", "Експреси та ординари"] },
  { name: "Агресивна стратегія", description: "Високий ризик, високий прибуток.", riskLevel: "High", expectedROI: 25, criteria: ["Мінімальний коефіцієнт 2.0", "Тільки експреси", "Формат BO1 та BO3", "Фокус на андердогах"] },
];

interface StrategyOverviewProps {
  topTabs?: { id: string; label: string; icon: import('lucide-react').LucideIcon }[];
  topActiveTab?: string;
  onTopTabChange?: (id: string) => void;
}

export default function StrategyOverview({ topTabs, topActiveTab, onTopTabChange }: StrategyOverviewProps) {
  logRender("StrategyOverview");
  const { user } = useAuth();
  const currentUser = user?.username || localStorage.getItem("username") || "default";
  const bumpStrategy = useAppStore((s) => s.bumpStrategy);

  const [strategies, setStrategies] = useState<CS2Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [bettingData, setBettingData] = useState<{ strategy?: string; amount?: number; result?: string; profit?: number; date?: string }[]>([]);
  const [strategyStats, setStrategyStats] = useState<Record<string, StrategyStats>>({});
  // Initialize from zustand store (persists across route navigations) + localStorage fallback
  const [primaryStrategy, setPrimaryStrategy] = useState<string | null>(() => {
    const storeId = useAppStore.getState().primaryStrategyId;
    if (storeId) return storeId;
    const saved = UserDataService.getUserData<string>(currentUser, "primary_strategy", "");
    return saved || null;
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<CS2Strategy | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [newlyCreatedStrategy, setNewlyCreatedStrategy] = useState<CS2Strategy | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"roi" | "profit" | "name">("roi");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [newStrategy, setNewStrategy] = useState({ name: "", description: "", criteria: [""], riskLevel: "Medium" as "Low" | "Medium" | "High", expectedROI: 10, blockAfterLosses: 3, blockDurationMinutes: 60 });

  const getPrimaryStrategyName = () => primaryStrategy ? (strategies.find((s) => s.id === primaryStrategy || s.name === primaryStrategy)?.name || primaryStrategy) : null;
  const isTemplateAlreadyCreated = (t: string) => strategies.some((s) => s.name.toLowerCase() === t.toLowerCase());

  // ── Data loading ──
  useEffect(() => { if (currentUser) loadData(); }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    let bets: { strategy?: string; amount?: number; result?: string; profit?: number; date?: string }[] = [];
    try { const j = await api.get<{ data?: unknown[] } | unknown[]>("/bets?page=1&limit=200"); bets = (Array.isArray(j) ? j : (j as { data?: unknown[] }).data || []) as typeof bets; } catch { bets = UserDataService.getUserData(currentUser, "mybets_data", []) as typeof bets; }

    let strats = UserDataService.getUserData<CS2Strategy[]>(currentUser, "strategies_data", []);
    try { const apiStrats = (await UserDataService.fetchStrategies()) as (Record<string, unknown> & { id?: string; config?: Record<string, unknown> })[]; if (apiStrats?.length) { strats = apiStrats.map((s) => ({ ...(s.config || {}), id: s.id, _backendId: s.id } as unknown as CS2Strategy)); UserDataService.setUserDataSync(currentUser, "strategies_data", strats); } } catch { /* ignore */ }
    setStrategies(strats);
    setBettingData(bets);
    calcStats(bets);
    const saved = UserDataService.getUserData<string>(currentUser, "primary_strategy", "")
      || useAppStore.getState().primaryStrategyId;
    if (saved) { setPrimaryStrategy(saved); useAppStore.getState().setPrimaryStrategyId(saved); }
    setLoading(false);
  };

  const calcStats = (bets: { strategy?: string; amount?: number; result?: string; profit?: number }[]) => {
    const stats: Record<string, StrategyStats> = {};
    bets.forEach((b) => {
      const s = b.strategy || "Без стратегії";
      if (!stats[s]) stats[s] = { totalBets: 0, wins: 0, losses: 0, pending: 0, totalProfit: 0, totalStake: 0, winRate: 0, roi: 0 };
      stats[s].totalBets++; stats[s].totalStake += b.amount || 0;
      if (b.result === "Win") { stats[s].wins++; stats[s].totalProfit += b.profit || 0; }
      else if (b.result === "Loss") { stats[s].losses++; stats[s].totalProfit += b.profit || 0; }
      else stats[s].pending++;
    });
    Object.keys(stats).forEach((s) => { const c = stats[s].wins + stats[s].losses; stats[s].winRate = c > 0 ? (stats[s].wins / c) * 100 : 0; stats[s].roi = stats[s].totalStake > 0 ? (stats[s].totalProfit / stats[s].totalStake) * 100 : 0; });
    setStrategyStats(stats);
  };

  // ── Handlers ──
  const saveStrategy = () => {
    if (!newStrategy.name || !newStrategy.description) { toast.error("Заповніть назву та опис"); return; }
    const valid = newStrategy.criteria.filter((c) => c.trim());
    if (!valid.length) { toast.error("Додайте хоча б один критерій"); return; }
    if (strategies.some((s) => s.name.toLowerCase() === newStrategy.name.toLowerCase().trim())) { toast.error("Така стратегія вже існує"); return; }
    if (strategies.length >= 25) { toast.error("Максимум 25 стратегій"); return; }

    const rules = parseCriteriaForValidation(valid);
    const strat: CS2Strategy = { id: crypto.randomUUID(), name: newStrategy.name, description: newStrategy.description, criteria: valid, riskLevel: newStrategy.riskLevel, expectedROI: newStrategy.expectedROI, activityLimits: { enabled: true, blockAfterLosses: newStrategy.blockAfterLosses, blockDurationMinutes: newStrategy.blockDurationMinutes, actionMode: "block" }, ...rules };
    const updated = [...strategies, strat];
    setStrategies(updated);
    UserDataService.setUserDataSync(currentUser, "strategies_data", updated);
    setNewlyCreatedStrategy(strat);
    UserDataService.createStrategy({ name: strat.name, isPrimary: false, config: strat }).then((bs: { id?: string }) => {
      if (bs?.id) { const all = UserDataService.getUserData<CS2Strategy[]>(currentUser, "strategies_data", []); const idx = all.findIndex((s) => (s.id || s.name) === (strat.id || strat.name)); if (idx >= 0) { all[idx] = { ...all[idx], _backendId: bs.id }; UserDataService.setUserDataSync(currentUser, "strategies_data", all); } }
    }).catch(() => {});
    bumpStrategy();
    setNewStrategy({ name: "", description: "", criteria: [""], riskLevel: "Medium", expectedROI: 10, blockAfterLosses: 3, blockDurationMinutes: 60 });
    setSuccessDialogOpen(true);
    setActiveTab("overview");
  };

  const handleSaveStrategy = (strat: CS2Strategy) => {
    if (strategies.length >= 25) { toast.error("Максимум 25 стратегій"); return; }
    const updated = [...strategies, strat];
    setStrategies(updated);
    UserDataService.setUserDataSync(currentUser, "strategies_data", updated);
    setNewlyCreatedStrategy(strat);
    UserDataService.createStrategy({ name: strat.name, isPrimary: false, config: strat }).then((bs: { id?: string }) => {
      if (bs?.id) { const all = UserDataService.getUserData<CS2Strategy[]>(currentUser, "strategies_data", []); const idx = all.findIndex((s) => (s.id || s.name) === (strat.id || strat.name)); if (idx >= 0) { all[idx] = { ...all[idx], _backendId: bs.id }; UserDataService.setUserDataSync(currentUser, "strategies_data", all); } }
    }).catch(() => {});
    bumpStrategy();
    setSuccessDialogOpen(true);
    setActiveTab("overview");
  };

  const deleteStrategy = () => {
    if (!strategyToDelete) return;
    const toRemove = strategies.find((s) => (s.id || s.name) === strategyToDelete);
    const updated = strategies.filter((s) => (s.id || s.name) !== strategyToDelete);
    setStrategies(updated);
    UserDataService.setUserDataSync(currentUser, "strategies_data", updated);
    if (primaryStrategy === strategyToDelete) { setPrimaryStrategy(null); UserDataService.setUserDataSync(currentUser, "primary_strategy", ""); }
    bumpStrategy();
    toast.success("Стратегію видалено");
    setDeleteDialogOpen(false);
    setStrategyToDelete(null);
    UserDataService.deleteStrategy(toRemove?._backendId || strategyToDelete, toRemove?.name).catch(() => {});
  };

  const togglePrimaryStrategy = (strat: CS2Strategy) => {
    const id = strat.id || strat.name;
    const store = useAppStore.getState();
    if (primaryStrategy === id) { setPrimaryStrategy(null); UserDataService.setUserDataSync(currentUser, "primary_strategy", ""); store.setPrimaryStrategyId(""); toast.success("Основну стратегію скасовано"); }
    else { setPrimaryStrategy(id); UserDataService.setUserDataSync(currentUser, "primary_strategy", id); store.setPrimaryStrategyId(id); if (strat._backendId) UserDataService.setPrimaryStrategy(strat._backendId).catch(() => {}); toast.success(`"${strat.name}" — основна стратегія`); }
    bumpStrategy();
  };

  // ── Derived ──
  const chartData = useMemo(() => {
    const entries = Object.entries(strategyStats);
    const mk = (fn: (s: StrategyStats) => number) => entries.map(([name, stats]) => ({ name: name.length > 15 ? name.substring(0, 15) + "..." : name, fullName: name, value: parseFloat(String(fn(stats))), totalBets: stats.totalBets, riskLevel: strategies.find((s) => s.name === name)?.riskLevel || "Medium" })).sort((a, b) => b.value - a.value).slice(0, 8);
    return { roiData: mk((s) => s.roi), winRateData: mk((s) => s.winRate), profitData: mk((s) => s.totalProfit) };
  }, [strategyStats, strategies]);

  const filteredStrategies = useMemo(() => strategies.filter((s) => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (riskFilter !== "all" && s.riskLevel !== riskFilter) return false;
    return true;
  }).sort((a, b) => {
    const sa = strategyStats[a.name], sb = strategyStats[b.name];
    let cmp = 0;
    if (sortBy === "roi") cmp = (sa?.roi || 0) - (sb?.roi || 0);
    else if (sortBy === "profit") cmp = (sa?.totalProfit || 0) - (sb?.totalProfit || 0);
    else cmp = a.name.localeCompare(b.name);
    return sortOrder === "desc" ? -cmp : cmp;
  }), [strategies, searchQuery, riskFilter, strategyStats, sortBy, sortOrder]);

  if (loading) return <StrategyLoadingSkeleton />;

  // ── JSX ──
  return (
    <div className="space-y-6">
      <StrategyTabNav activeTab={activeTab} showFilters={showFilters} onTabChange={setActiveTab} onFilterToggle={() => setShowFilters(!showFilters)} onCreateClick={() => setShowCreateDialog(true)} topTabs={topTabs} topActiveTab={topActiveTab} onTopTabChange={onTopTabChange} />

      {activeTab === "overview" && (
        <div className="space-y-6">
          {strategies.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <StrategyEmptyState onCreateStrategy={() => setShowCreateDialog(true)} />
            </div>
          ) : (
            <>
              {showFilters && <StrategyFilters searchQuery={searchQuery} riskFilter={riskFilter} sortBy={sortBy} sortOrder={sortOrder} onSearchChange={setSearchQuery} onRiskFilterChange={setRiskFilter} onSortByChange={setSortBy} onSortOrderToggle={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} />}
              <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStrategies.map((s, i) => {
                    const stats = strategyStats[s.name] || {} as StrategyStats;
                    return <StrategyCard key={s.id || s.name || i} strategy={s} stats={stats} isPrimary={primaryStrategy === (s.id || s.name)} getRiskIcon={getRiskIcon} getRiskColor={getRiskColor} onDetails={(s) => { setSelectedStrategy(s); setDetailsDialogOpen(true); }} onTogglePrimary={togglePrimaryStrategy} onDelete={(id) => { setStrategyToDelete(id); setDeleteDialogOpen(true); }} />;
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StrategyOverallStats strategiesCount={strategies.length} betsCount={bettingData.length} bestStrategy={Object.keys(strategyStats).length > 0 ? Object.keys(strategyStats).reduce((best, cur) => (strategyStats[cur]?.roi || 0) > (strategyStats[best]?.roi || 0) ? cur : best, Object.keys(strategyStats)[0] || "Немає") : "Немає"} primaryStrategyName={getPrimaryStrategyName()} />
            <StrategyTopRoiList stats={strategyStats} primaryStrategyName={getPrimaryStrategyName()} />
            <StrategyRecommendations recommendations={strategies.length > 0 ? [{ type: "info" as const, message: "Використовуйте стратегії з ROI > 5%" }, { type: "warning" as const, message: "Уникайте ризикованих команд" }, { type: "success" as const, message: "Ведіть статистику для покращення" }] : []} />
          </div>
          <StrategyPerformanceCharts roiData={chartData.roiData} winRateData={chartData.winRateData} profitData={chartData.profitData} />
        </div>
      )}

      {activeTab === "create" && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100"><div className="flex items-center gap-3"><Plus className="h-5 w-5 text-gray-900" strokeWidth={1.5} /><span className="text-lg font-semibold text-gray-900">Створити нову стратегію</span></div><Button size="sm" onClick={() => setTemplateDialogOpen(true)} className="rounded-xl bg-primary hover:bg-[#3b6de0] text-white font-medium border-0"><Zap className="h-4 w-4 mr-2" strokeWidth={1.5} />Використати шаблон</Button></div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label className="text-gray-900 font-medium">Назва *</Label><Input value={newStrategy.name} onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })} className="rounded-xl border-gray-200 mt-1.5" /></div>
              <div><Label className="text-gray-900 font-medium">Рівень ризику</Label><Select value={newStrategy.riskLevel} onValueChange={(v: "Low" | "Medium" | "High") => setNewStrategy({ ...newStrategy, riskLevel: v })}><SelectTrigger className="rounded-xl border-gray-200 mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Низький</SelectItem><SelectItem value="Medium">Середній</SelectItem><SelectItem value="High">Високий</SelectItem></SelectContent></Select></div>
              <div><Label className="text-gray-900 font-medium">Очікуваний ROI (%)</Label><Input type="number" min="0" max="100" value={newStrategy.expectedROI} onChange={(e) => setNewStrategy({ ...newStrategy, expectedROI: parseInt(e.target.value) || 0 })} className="rounded-xl border-gray-200 mt-1.5" /></div>
            </div>
            <div><Label className="text-gray-900 font-medium">Опис</Label><Textarea value={newStrategy.description} onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })} rows={3} className="rounded-xl border-gray-200 mt-1.5" /></div>
            <div><div className="flex items-center justify-between mb-2"><Label className="text-gray-900 font-medium">Критерії</Label><Button type="button" variant="outline" size="sm" onClick={() => setNewStrategy({ ...newStrategy, criteria: [...newStrategy.criteria, ""] })} className="rounded-xl bg-blue-50 border-blue-100 font-medium text-blue-500 hover:bg-blue-100"><Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />Додати</Button></div>
              <div className="space-y-2">{newStrategy.criteria.map((c, i) => (<div key={i} className="flex gap-2"><Input value={c} onChange={(e) => setNewStrategy({ ...newStrategy, criteria: newStrategy.criteria.map((cc, ii) => ii === i ? e.target.value : cc) })} className="rounded-xl border-gray-200" />{newStrategy.criteria.length > 1 && <Button type="button" variant="outline" size="sm" onClick={() => setNewStrategy({ ...newStrategy, criteria: newStrategy.criteria.filter((_, ii) => ii !== i) })} className="rounded-xl border-gray-200"><X className="h-4 w-4" strokeWidth={1.5} /></Button>}</div>))}</div>
            </div>
            <Button onClick={saveStrategy} className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium h-11"><Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />Зберегти стратегію</Button>
          </div>
        </div>
      )}

      <StrategySuccessDialog open={successDialogOpen} onOpenChange={(open) => { setSuccessDialogOpen(open); if (!open) setNewlyCreatedStrategy(null); }} strategy={newlyCreatedStrategy} />
      <StrategyDetailsDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} strategy={selectedStrategy} stats={selectedStrategy ? strategyStats[selectedStrategy.name] : undefined} isPrimary={!!(selectedStrategy && primaryStrategy === (selectedStrategy.id || selectedStrategy.name))} />

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="rounded-3xl max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-200">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900"><Zap className="h-5 w-5 text-amber-500" strokeWidth={1.5} />Шаблони стратегій</DialogTitle><DialogDescription className="text-gray-500">Виберіть готовий шаблон</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STRATEGY_TEMPLATES.map((t, i) => {
              const exists = isTemplateAlreadyCreated(t.name);
              return (
                <div key={i} className={`border rounded-2xl p-5 ${exists ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed" : "bg-white border-gray-200 hover:border-gray-300 cursor-pointer"}`} onClick={() => { if (!exists) { setNewStrategy({ name: t.name, description: t.description, criteria: [...t.criteria], riskLevel: t.riskLevel, expectedROI: t.expectedROI, blockAfterLosses: 3, blockDurationMinutes: 60 }); setTemplateDialogOpen(false); toast.success(`Шаблон "${t.name}" застосовано!`); } }}>
                  <div className="flex items-center justify-between mb-3"><span className="flex items-center gap-2 font-semibold text-gray-900">{getRiskIcon(t.riskLevel)}<span className="text-sm">{t.name}</span></span><Badge className={getRiskColor(t.riskLevel) + " text-xs font-medium"}>{t.riskLevel}</Badge></div>
                  <p className="text-sm text-gray-500 mb-3">{t.description}</p>
                  <div className="p-2 bg-[#DCFCE7] rounded-xl text-center mb-3"><div className="text-lg font-bold text-green-600">+{t.expectedROI}%</div><div className="text-xs text-gray-500">Очікуваний ROI</div></div>
                  <ul className="space-y-1">{t.criteria.slice(0, 3).map((c, j) => (<li key={j} className="text-xs text-gray-500 flex items-center gap-1"><div className="w-1 h-1 bg-blue-500 rounded-full" />{c}</li>))}</ul>
                  <Button className={`w-full rounded-xl font-medium mt-3 ${exists ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : "bg-gray-900 hover:bg-gray-800 text-white"}`} size="sm" disabled={exists}>{exists ? "Вже створено" : "Використати шаблон"}</Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md border border-gray-200 p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-100"><Trash2 className="h-5 w-5 text-red-600" strokeWidth={1.5} /></div><DialogTitle className="text-xl font-semibold text-gray-900">Видалити стратегію?</DialogTitle></div></DialogHeader>
          <div className="border-t border-gray-200" />
          <div className="px-6 pb-6 pt-4 space-y-3 bg-gray-100">
            <div className="text-center"><div className="flex flex-col items-center px-5 py-5 bg-white rounded-2xl border border-gray-200 shadow-sm"><DialogDescription className="text-lg font-bold text-gray-900 text-center">{strategyToDelete && strategies.find((s) => (s.id || s.name) === strategyToDelete)?.name || strategyToDelete}</DialogDescription></div></div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-red-200"><AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} /><p className="text-sm text-[#991B1B]">Ця дія незворотна. Статистика ставок залишиться незмінною.</p></div>
            <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl border-gray-200 font-medium">Скасувати</Button><Button onClick={deleteStrategy} className="rounded-xl bg-red-600 hover:bg-[#B91C1C] text-white"><Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />Видалити</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <CreateStrategyDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} strategies={strategies} onSave={handleSaveStrategy} />
    </div>
  );
}
