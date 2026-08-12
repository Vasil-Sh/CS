import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getStatusBadge } from "@/lib/utils/badgeStyles";
import { getGameEmoji } from "@/lib/utils/gameIcons";
import { logRender } from "@/lib/devLogger";
import {
  Shield,
  Users,
  AlertTriangle,
  TrendingDown,
  Target,
  Plus,
  Trash2,
  Search,
  Info,
  RefreshCw,
  Download,
  Pencil,
  Check,
  X,
  ArrowRightLeft,
} from "lucide-react";
import {
  useRiskyTeams,
  ALL_STATUSES,
  type RiskyTeam,
} from "@/hooks/useRiskyTeams";

const getStatusFilterBadge = (status: string, isActive: boolean) => {
  const base = isActive
    ? "ring-2 ring-offset-1"
    : "opacity-70 hover:opacity-100";
  const colors: Record<string, string> = {
    БАН: `bg-[#FEE2E2] text-red-600 border border-red-200 ${isActive ? "ring-red-200" : ""}`,
    Ризиковані: `bg-orange-100 text-orange-600 border border-orange-200 ${isActive ? "ring-orange-200" : ""}`,
    Нестабільні: `bg-orange-100 text-orange-600 border border-orange-200 ${isActive ? "ring-orange-200" : ""}`,
    Обережно: `bg-amber-100 text-amber-600 border border-amber-200 ${isActive ? "ring-amber-200" : ""}`,
    'Під питанням': `bg-amber-100 text-amber-600 border border-amber-200 ${isActive ? "ring-amber-200" : ""}`,
    Стабільні: `bg-blue-50 text-blue-600 border border-blue-200 ${isActive ? "ring-blue-200" : ""}`,
    Надійна: `bg-green-50 text-green-600 border border-green-200 ${isActive ? "ring-green-200" : ""}`,
    Неоцінена: `bg-gray-50 text-gray-500 border border-gray-200 ${isActive ? "ring-gray-200" : ""}`,
  };
  return `${colors[status] || ""} ${base}`;
};

const renderStatusFilter = (
  current: string,
  setFilter: (v: string) => void,
  counts: Record<string, number>,
) => (
  <div className="flex flex-wrap items-center gap-1.5 pt-6 pb-2">
    <button
      onClick={() => setFilter("all")}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${current === "all" ? "bg-gray-900 text-white ring-2 ring-offset-1 ring-gray-900" : "bg-gray-100 text-gray-700 border border-gray-200 opacity-70 hover:opacity-100"}`}
    >
      Всі ({counts.all})
    </button>
    {ALL_STATUSES.map((s) => {
      const c = counts[s] || 0;
      if (!c) return null;
      return (
        <button
          key={s}
          onClick={() => setFilter(current === s ? "all" : s)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${getStatusFilterBadge(s, current === s)}`}
        >
          {s} ({c})
        </button>
      );
    })}
  </div>
);

export default function RiskManagement() {
  logRender("RiskManagement");
  const h = useRiskyTeams();

  const renderTeamCard = (team: RiskyTeam, index: number) => {
    const editing = h.editingIndex === index;
    if (editing)
      return (
        <div
          key={index}
          className="p-4 border border-gray-300 rounded-2xl bg-gray-50"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Назва
                </label>
                <Input
                  value={h.editName}
                  onChange={(e) => h.setEditName(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Статус
                </label>
                <select
                  value={h.editStatus}
                  onChange={(e) => h.setEditStatus(e.target.value)}
                  className="w-full p-2 border border-gray-200 bg-white rounded-xl text-sm"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                Перенести
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => h.setEditGame("CS")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border ${h.editGame === "CS" ? "bg-primary text-white border-primary" : "bg-white text-gray-500 border-gray-200"}`}
                >
                  🎯 CS
                </button>
                <button
                  onClick={() => h.setEditGame("Дота")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border ${h.editGame === "Дота" ? "bg-primary text-white border-primary" : "bg-white text-gray-500 border-gray-200"}`}
                >
                  🛡️ Дота
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Коментар
              </label>
              <Textarea
                value={h.editNotes}
                onChange={(e) => h.setEditNotes(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white text-sm"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={h.cancelEditing}
                className="text-gray-500"
              >
                <X className="h-4 w-4 mr-1" />
                Скасувати
              </Button>
              <Button
                size="sm"
                onClick={h.saveEditing}
                disabled={!h.editName.trim()}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Зберегти
              </Button>
            </div>
          </div>
        </div>
      );
    return (
      <div
        key={index}
        className="p-4 border border-gray-300 rounded-2xl bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-base text-gray-900">
                {getGameEmoji(team.game)} {team.name}
              </h3>
              <Badge className={getStatusBadge(team.status)}>
                {team.status || "Неоцінена"}
              </Badge>
            </div>
            {team.notes && (
              <p className="text-sm text-gray-500 whitespace-pre-wrap">
                {team.notes}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => h.startEditing(index, team)}
              className="text-primary hover:text-primary hover:bg-blue-50 rounded-xl"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => h.deleteRiskyTeam(index)}
              className="text-red-500 hover:text-red-500 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 min-h-0 space-y-6">
        {/* Overview Cards */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                label: "Всього команд",
                value: h.teamStats.total,
                badge: `CS: ${h.teamStats.csCount} · Dota: ${h.teamStats.dotaCount}`,
                badgeClass: "bg-green-50 text-green-600 border-green-200",
              },
              {
                icon: TrendingDown,
                label: "Заборонені",
                value: h.teamStats.banCount,
                badge: `БАН · ${h.teamStats.banPercentage}%`,
                badgeClass: "bg-red-50 text-red-600 border-red-200",
              },
              {
                icon: AlertTriangle,
                label: "Високий ризик",
                value: h.teamStats.attentionCount,
                badge: `БАН: ${h.teamStats.banCount} · Нестаб: ${h.teamStats.unstableCount}`,
                badgeClass: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",
              },
              {
                icon: Target,
                label: "Основна гра",
                value: h.teamStats.dominantGame,
                badge: `${h.teamStats.dominantGameCount} команд`,
                badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-3xl px-6 py-5 group transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                    <c.icon
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {c.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                  {c.value}
                </div>
                <Badge
                  className={`${c.badgeClass} rounded-lg font-medium text-xs px-3 py-1.5`}
                >
                  {c.badge}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar — matches Matches/Strategy pill-button pattern */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-stone-200 p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            {/* Info tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center w-11 h-11 rounded-[24px] bg-transparent text-blue-500 hover:bg-blue-50 border border-stone-200 transition-all duration-300">
                  <Info className="h-4 w-4" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-xs bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-lg"
              >
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Управління ризиками
                </p>
                <p className="text-xs text-gray-500">
                  Додавайте команди вручну або підтягуйте з Google Sheets.
                  Статуси "БАН", "Ризиковані", "Під питанням" впливають на
                  рекомендації при створенні ставок.
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Search toggle */}
            <button
              onClick={() => h.setIsSearchOpen(!h.isSearchOpen)}
              className={`flex items-center justify-center w-11 h-11 rounded-[24px] transition-all duration-300 ${
                h.isSearchOpen
                  ? "bg-primary text-white shadow-[0_2px_8px_rgba(68,122,252,0.3)]"
                  : "bg-transparent text-gray-400 border border-stone-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Search className="h-4 w-4" strokeWidth={2} />
            </button>

            {/* Delete all — only when teams exist */}
            {h.riskyTeams.length > 0 && (
              <button
                onClick={() => h.setIsDeleteAllOpen(true)}
                className="flex items-center gap-2 px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out bg-transparent text-red-500 font-light border border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span>Видалити всі</span>
              </button>
            )}

            {/* Google Sheets */}
            <button
              onClick={() => h.setIsSheetsGuideOpen(true)}
              disabled={h.isUpdating}
              className="flex items-center gap-2 px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out bg-transparent text-gray-900 font-light border border-stone-200 hover:bg-gray-50 disabled:opacity-50"
            >
              {h.isUpdating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" strokeWidth={1.5} />
              )}
              <span>
                {h.isUpdating ? "Завантаження..." : "Підтягнути з Google Sheets"}
              </span>
            </button>

            {/* Add team — primary action */}
            <button
              onClick={() => h.setIsAddTeamOpen(true)}
              className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-semibold bg-primary text-white hover:bg-blue-400 shadow-[0_2px_8px_rgba(68,122,252,0.3)] transition-all duration-300 ease-in-out"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Додати команду</span>
            </button>
          </div>
        </div>

        {/* Inline search input — shown when toggled */}
        {h.isSearchOpen && (
          <div
            className="bg-white border border-gray-200 rounded-2xl p-4"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                strokeWidth={1.5}
              />
              <Input
                value={h.searchQuery}
                onChange={(e) => h.setSearchQuery(e.target.value)}
                placeholder="Пошук за назвою, грою, статусом або примітками..."
                className="pl-10 w-full rounded-xl border border-gray-200 hover:border-gray-300 focus:border-gray-900 transition-colors text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Google Sheets Guide Dialog */}
        <Dialog
          open={h.isSheetsGuideOpen}
          onOpenChange={h.setIsSheetsGuideOpen}
        >
          <DialogContent className="rounded-3xl max-w-2xl border border-gray-200 p-0 gap-0">
            <DialogHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-100 flex-shrink-0">
                  <Download
                    className="h-5 w-5 text-blue-600"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    Підтягнути команди з Google Sheets
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 mt-0.5">
                    Як оформити документ, щоб дані правильно підтягнулись
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="border-t border-gray-200" />
            <div className="space-y-3 px-5 pt-4 pb-5 bg-gray-100">
              {/* Step 1 */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      Створіть Google Sheets документ
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Відкрийте новий документ на{" "}
                      <span className="font-medium text-gray-900">
                        Google Sheets
                      </span>{" "}
                      і дайте йому будь-яку назву.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-2">
                      Оформіть колонки
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-gray-900 border-r border-b border-gray-300">
                              A — Назва команди
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-900 border-b border-gray-300">
                              B — Статус
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-3 py-2 text-gray-700 border-r border-b border-gray-200">
                              Vitality
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-b border-gray-200">
                              🟩 CS: У фіналах часто вимикаються…
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-gray-700 border-r border-b border-gray-200">
                              Team Spirit
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-b border-gray-200">
                              🟨 Dota2: Тільки на +1.5, часто заливають
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-gray-700 border-r border-b border-gray-200">
                              Virtus Pro
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-b border-gray-200">
                              🟥 CS: Раки — дуже рідко на них варто щось ставити
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      💡 Перший рядок може бути заголовком — він буде
                      автоматично проігнорований.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 — Open access */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      Відкрийте доступ до документу
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Натисніть{" "}
                      <span className="font-medium text-gray-900">
                        «Поділитися» → «Усі, хто має посилання» → «Читач»
                      </span>
                      , щоб документ був доступний для читання.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-2">
                      Вставте посилання на ваш документ
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Скопіюйте посилання з адресного рядка браузера та вставте
                      його сюди. Ви можете використовувати{" "}
                      <span className="font-medium text-gray-900">власний</span>{" "}
                      Google Sheets документ.
                    </p>
                    <Input
                      value={h.customSheetUrl}
                      onChange={(e) => h.setCustomSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/ВАШ_ID/edit"
                      className="rounded-xl border-blue-200 focus:border-blue-600 bg-white text-sm"
                    />
                    {h.customSheetUrl.trim() &&
                      !h.customSheetUrl.trim().includes("spreadsheets/d/") && (
                        <p className="text-xs text-red-500 mt-1.5">
                          ❌ Неправильний формат посилання. Перевірте, чи
                          скопійовано повне посилання з Google Sheets.
                        </p>
                      )}
                    {h.customSheetUrl.trim() &&
                      h.customSheetUrl.trim().includes("spreadsheets/d/") && (
                        <p className="text-xs text-green-600 mt-1.5">
                          ✓ Посилання правильне. Будуть завантажені команди з
                          вашого документу.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
                <AlertTriangle
                  className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5"
                  strokeWidth={1.75}
                />
                <div className="text-sm text-gray-900">
                  <span className="font-semibold text-red-600">Важливо:</span>{" "}
                  при оновленні <strong>всі команди замінюються</strong> даними
                  з Google Sheets. Документ є джерелом правди — локальні зміни
                  будуть перезаписані.
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-5 py-3">
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => h.setIsSheetsGuideOpen(false)}
                  className="rounded-xl border-gray-200 font-medium"
                >
                  Скасувати
                </Button>
                <Button
                  onClick={() => {
                    h.updateFromGoogleSheets();
                    h.setIsSheetsGuideOpen(false);
                  }}
                  disabled={h.isUpdating}
                  className="rounded-xl bg-primary hover:bg-blue-700 text-white font-medium"
                >
                  {h.isUpdating ? (
                    <>
                      <RefreshCw
                        className="mr-2 h-4 w-4 animate-spin"
                        strokeWidth={2}
                      />
                      Завантаження...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" strokeWidth={2} />
                      Отримати данні
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* CS + Dota Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CS */}
          <Card
            className="border border-gray-200 rounded-[24px] bg-white overflow-hidden flex flex-col"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
            }}
          >
            <CardHeader className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                CS команди
              </CardTitle>
              {renderStatusFilter(
                h.csStatusFilter,
                h.setCsStatusFilter,
                h.csStatusCounts,
              )}
            </CardHeader>
            <CardContent className="p-4 bg-gray-50 flex-1 max-h-[600px] overflow-y-auto rounded-b-[24px]">
              <div className="space-y-3">
                {h.csTeams.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    {h.csStatusFilter !== "all" ? (
                      <Button
                        onClick={() => h.setCsStatusFilter("all")}
                        className="rounded-xl bg-primary text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Скинути фільтр
                      </Button>
                    ) : (
                      <Button
                        onClick={() => h.setIsAddTeamOpen(true)}
                        className="rounded-xl bg-primary text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Додати команду
                      </Button>
                    )}
                  </div>
                ) : (
                  h.csTeams.map((t) =>
                    renderTeamCard(t, h.riskyTeams.indexOf(t)),
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dota 2 */}
          <Card
            className="border border-gray-200 rounded-[24px] bg-white overflow-hidden flex flex-col"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
            }}
          >
            <CardHeader className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                Dota 2 команди
              </CardTitle>
              {renderStatusFilter(
                h.dotaStatusFilter,
                h.setDotaStatusFilter,
                h.dotaStatusCounts,
              )}
            </CardHeader>
            <CardContent className="p-4 bg-gray-50 flex-1 max-h-[600px] overflow-y-auto rounded-b-[24px]">
              <div className="space-y-3">
                {h.dotaTeams.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    {h.dotaStatusFilter !== "all" ? (
                      <Button
                        onClick={() => h.setDotaStatusFilter("all")}
                        className="rounded-xl bg-primary text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Скинути фільтр
                      </Button>
                    ) : (
                      <Button
                        onClick={() => h.setIsAddTeamOpen(true)}
                        className="rounded-xl bg-primary text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Додати команду
                      </Button>
                    )}
                  </div>
                ) : (
                  h.dotaTeams.map((t) =>
                    renderTeamCard(t, h.riskyTeams.indexOf(t)),
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Team Dialog */}
        <Dialog open={h.isAddTeamOpen} onOpenChange={h.setIsAddTeamOpen}>
          <DialogContent className="rounded-3xl max-w-md border border-gray-200">
            <DialogHeader>
              <DialogTitle>Додати команду</DialogTitle>
              <DialogDescription>
                Додайте нову ризиковану команду до списку
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Назва команди"
                value={h.newTeam?.name || ""}
                onChange={(e) =>
                  h.setNewTeam({ ...h.newTeam!, name: e.target.value })
                }
                className="rounded-xl"
              />
              <select
                value={h.newTeam?.game || "CS"}
                onChange={(e) =>
                  h.setNewTeam({ ...h.newTeam!, game: e.target.value })
                }
                className="w-full p-2 border border-gray-200 rounded-xl"
              >
                <option value="CS">CS</option>
                <option value="Дота">Dota 2</option>
              </select>
              <select
                value={h.newTeam?.status || "Під питанням"}
                onChange={(e) =>
                  h.setNewTeam({ ...h.newTeam!, status: e.target.value })
                }
                className="w-full p-2 border border-gray-200 rounded-xl"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Textarea
                placeholder="Нотатки"
                value={h.newTeam?.notes || ""}
                onChange={(e) =>
                  h.setNewTeam({ ...h.newTeam!, notes: e.target.value })
                }
                rows={2}
                className="rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => h.setIsAddTeamOpen(false)}
              >
                Скасувати
              </Button>
              <Button
                onClick={() => {
                  h.addRiskyTeam();
                  h.setIsAddTeamOpen(false);
                }}
                className="bg-gray-900 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Додати
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete All Dialog */}
        <Dialog open={h.isDeleteAllOpen} onOpenChange={h.setIsDeleteAllOpen}>
          <DialogContent className="rounded-3xl max-w-md border border-gray-200">
            <DialogHeader>
              <DialogTitle>Видалити всі команди?</DialogTitle>
              <DialogDescription>
                Ця дія незворотна. Всі ризиковані команди будуть видалені.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => h.setIsDeleteAllOpen(false)}
              >
                Скасувати
              </Button>
              <Button
                onClick={h.deleteAllTeams}
                className="bg-red-600 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Видалити всі
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
