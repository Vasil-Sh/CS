import { useState } from "react";
import { Link, Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getGroupedBetTypeOptions } from "@/lib/displayHelpers";

interface FormMatchData {
  game: "CS2" | "Dota2";
  format: string;
  betCategory: string;
  matchUrl: string;
  team1: string;
  team2: string;
  betType: string;
  selection: string;
  odds: string;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
}

interface BettingFormMatchSectionProps {
  data: FormMatchData;
  isParsing: boolean;
  isExpressFromMatches: boolean;
  expressEventsCount: number;
  classes: {
    input: string;
    selectTrigger: string;
    label: string;
    sectionTitle: string;
  };
  onFieldChange: <K extends keyof FormMatchData>(
    field: K,
    value: FormMatchData[K],
  ) => void;
  onParseUrl: () => void;
  onUrlChange: (url: string) => void;
  onAddToExpress: () => void;
}

export default function BettingFormMatchSection({
  data,
  isParsing,
  isExpressFromMatches,
  expressEventsCount,
  classes,
  onFieldChange,
  onParseUrl,
  onUrlChange,
  onAddToExpress,
}: BettingFormMatchSectionProps) {
  const isExpress = data.betCategory === "Експрес";
  const showRequired = isExpress && expressEventsCount === 0;
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [betTab, setBetTab] = useState(1); // 1=Основне, 2+=Карта N
  const [tempBetType, setTempBetType] = useState(data.betType);
  const grouped = getGroupedBetTypeOptions(data.format);
  const maxMaps =
    data.format === "BO5"
      ? 5
      : data.format === "BO3"
        ? 3
        : data.format === "BO1"
          ? 1
          : 3;

  const openBetModal = () => {
    setTempBetType(data.betType);
    setBetTab(1);
    setBetModalOpen(true);
  };

  const saveBetType = () => {
    onFieldChange("betType", tempBetType);
    setBetModalOpen(false);
  };

  const renderGroup = (group: {
    category: string;
    options: { value: string; label: string }[];
  }) => {
    if (group.category === "Фора") {
      const seen = new Set<string>();
      const negs = group.options.filter(
        (o) => o.label.includes("-") && !seen.has(o.label) && seen.add(o.label),
      );
      const poss = group.options.filter(
        (o) => o.label.includes("+") && !seen.has(o.label) && seen.add(o.label),
      );
      return (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-3">
          <div className="text-xs font-semibold text-[#447afc] uppercase tracking-wider mb-2">{group.category}</div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={tempBetType || ''} onValueChange={(v) => setTempBetType(v || '')}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm"><SelectValue placeholder="Мінус" /></SelectTrigger>
              <SelectContent>{negs.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={tempBetType || ''} onValueChange={(v) => setTempBetType(v || '')}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm"><SelectValue placeholder="Плюс" /></SelectTrigger>
              <SelectContent>{poss.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    if (group.category === "Тотал") {
      const unders = group.options.filter((o) => o.label.includes("Менше"));
      const overs = group.options.filter((o) => o.label.includes("Більше"));
      return (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-3">
          <div className="text-xs font-semibold text-[#447afc] uppercase tracking-wider mb-2">{group.category}</div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={tempBetType || ''} onValueChange={(v) => setTempBetType(v || '')}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm"><SelectValue placeholder="Менше" /></SelectTrigger>
              <SelectContent>{unders.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={tempBetType || ''} onValueChange={(v) => setTempBetType(v || '')}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm"><SelectValue placeholder="Більше" /></SelectTrigger>
              <SelectContent>{overs.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    // Small groups (1-3 options) — inline buttons
    if (group.options.length <= 3) {
      return (
        <div className={"bg-white rounded-xl border border-gray-200/80 shadow-sm p-3 flex items-center justify-between gap-2 " + (tempBetType && group.options.some(o => o.value === tempBetType) ? "border-[#447afc] bg-[#EFF6FF]" : "")}>
          <div className="text-xs font-semibold text-[#447afc] uppercase tracking-wider shrink-0">{group.category}</div>
          <div className="flex gap-1 flex-wrap justify-end">
            {group.options.map((opt) => {
              const isSelected = tempBetType === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => setTempBetType(opt.value)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${isSelected ? "bg-[#447afc] text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    // Larger groups get a Select dropdown
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-3">
        <div className="text-xs font-semibold text-[#447afc] uppercase tracking-wider mb-2">{group.category}</div>
        <Select value={tempBetType || ''} onValueChange={(v) => setTempBetType(v || '')}>
          <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm"><SelectValue placeholder="Оберіть..." /></SelectTrigger>
          <SelectContent>
            {group.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className={classes.sectionTitle}>
          <Users className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
          Інформація про матч і деталі запису
        </h3>

        {/* Match URL */}
        <div className="space-y-1.5">
          <Label
            htmlFor="matchUrl"
            className={`${classes.label} flex items-center gap-2`}
          >
            <Link className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
            {data.game === "CS2" ? "HLTV URL матчу" : "Dota 2 URL матчу"}{" "}
            (необов&apos;язково)
          </Label>
          <div className="flex gap-2">
            <Input
              id="matchUrl"
              value={data.matchUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={
                data.game === "CS2"
                  ? "https://www.hltv.org/matches/..."
                  : "https://...dota2/.../team1-vs-team2/..."
              }
              className={`flex-1 ${classes.input}`}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onParseUrl}
              disabled={isParsing || !data.matchUrl}
              className="rounded-2xl px-5 border-gray-200 hover:bg-gray-100 hover:border-gray-300 h-11 text-sm font-medium"
            >
              {isParsing ? "Оновлення..." : "Оновити"}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            {data.game === "CS2"
              ? "Вставте посилання з HLTV для автозаповнення"
              : "Вставте посилання на Dota 2 матч для автозаповнення"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="team1" className={classes.label}>
              Команда 1{" "}
              {showRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              {data.logoTeam1 && (
                <img
                  src={data.logoTeam1}
                  alt={data.team1}
                  className="h-9 w-9 rounded-xl object-contain bg-gray-100 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <Input
                id="team1"
                value={data.team1}
                onChange={(e) => onFieldChange("team1", e.target.value)}
                placeholder={data.game === "CS2" ? "NAVI" : "Team Spirit"}
                required={!isExpress || (isExpress && expressEventsCount === 0)}
                className={classes.input}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team2" className={classes.label}>
              Команда 2{" "}
              {showRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              {data.logoTeam2 && (
                <img
                  src={data.logoTeam2}
                  alt={data.team2}
                  className="h-9 w-9 rounded-xl object-contain bg-gray-100 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <Input
                id="team2"
                value={data.team2}
                onChange={(e) => onFieldChange("team2", e.target.value)}
                placeholder={data.game === "CS2" ? "G2" : "OG"}
                required={!isExpress || (isExpress && expressEventsCount === 0)}
                className={classes.input}
              />
            </div>
          </div>
        </div>

        {/* Bet type: button that opens modal */}
        <div className="flex items-end gap-3">
          <div className="flex-[2] space-y-1.5">
            <Label className={classes.label}>
              Тип прогнозу{" "}
              {showRequired && <span className="text-red-500">*</span>}
            </Label>
            <button
              type="button"
              disabled={!data.team1 || !data.team2}
              onClick={openBetModal}
              className={`w-full h-11 rounded-2xl border font-medium text-sm transition-colors text-center px-4 ${
                !data.team1 || !data.team2
                  ? "border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed"
                  : data.betType
                    ? "border-[#447afc] bg-[#EFF6FF] text-[#447afc] hover:bg-[#DBEAFE]"
                    : "border-[#447afc] bg-[#447afc] text-white hover:bg-[#3568d4]"
              }`}
            >
              {!data.team1 || !data.team2
                ? "Спочатку введіть команди"
                : data.betType
                  ? `${data.betType} → ${data.selection || '?'}`
                  : "Оберіть тип прогнозу"}
            </button>
          </div>
          <div className="flex-[2] space-y-1.5">
            <Label className={classes.label}>
              Вибір {showRequired && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={data.selection}
              onValueChange={(value) => onFieldChange("selection", value)}
              disabled={!data.team1 || !data.team2}
            >
              <SelectTrigger className={classes.selectTrigger}>
                <SelectValue
                  placeholder={
                    data.team1 && data.team2
                      ? "Оберіть команду"
                      : "Спочатку введіть команди"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {data.team1 && (
                  <SelectItem value={data.team1}>{data.team1}</SelectItem>
                )}
                {data.team2 && (
                  <SelectItem value={data.team2}>{data.team2}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="odds" className={classes.label}>
              Коефіцієнт{" "}
              {showRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="odds"
              type="number"
              step="0.01"
              min="1.01"
              value={data.odds}
              onChange={(e) => onFieldChange("odds", e.target.value)}
              placeholder="1.65"
              required={!isExpress || (isExpress && expressEventsCount === 0)}
              className={classes.input}
            />
          </div>
        </div>

        {/* Show "Add event to express" button ONLY when NOT pre-filled from matches */}
        {isExpress && !isExpressFromMatches && (
          <Button
            type="button"
            onClick={onAddToExpress}
            disabled={expressEventsCount >= 10}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-medium py-6 text-base transition-all"
          >
            <Plus className="h-5 w-5 mr-2" strokeWidth={1.5} />
            Додати подію до експресу ({expressEventsCount}/10)
          </Button>
        )}
      </div>

      {/* Bet Type Modal */}
      {betModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setBetModalOpen(false)}
        >
          <div className="fixed inset-0 bg-black/40 pointer-events-none" />
          <div
            className="relative bg-white rounded-3xl shadow-xl w-full max-w-xl mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-[#111827]">
                Тип прогнозу
              </h3>
              <button
                type="button"
                onClick={() => setBetModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto">
              {[
                { label: "Основне", idx: 1 },
                ...Array.from({ length: maxMaps }, (_, i) => ({
                  label: `Карта ${i + 1}`,
                  idx: i + 2,
                })),
              ].map((tab) => (
                <button
                  key={tab.idx}
                  type="button"
                  onClick={() => setBetTab(tab.idx)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${betTab === tab.idx ? "bg-[#447afc] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Tab: Основне */}
              {betTab === 1 && <div className="grid grid-cols-2 gap-2">{grouped.main.map((group) => renderGroup(group))}</div>}
              {/* Tab: Карта N */}
              {betTab >= 2 &&
                <div className="grid grid-cols-2 gap-2">
                  {(grouped.maps.find((m) => m.mapNumber === betTab - 1)?.groups ?? []).map((group) => renderGroup(group))}
                </div>}
            </div>
            {/* Footer with Clear / Cancel / Save buttons */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => setTempBetType('')}
                className={`px-4 h-11 rounded-2xl border font-medium text-sm transition-colors ${
                  tempBetType
                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                    : 'border-gray-200 text-gray-300 cursor-not-allowed'
                }`}
                disabled={!tempBetType}
              >
                Очистити
              </button>
              <button
                type="button"
                onClick={() => setBetModalOpen(false)}
                className="flex-1 h-11 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={saveBetType}
                disabled={!tempBetType}
                className={`flex-1 h-11 rounded-2xl font-medium text-sm transition-all ${tempBetType ? "bg-[#447afc] text-white hover:bg-[#3568d4] shadow-sm" : "bg-[#F9FAFB] text-[#9CA3AF] border border-[#E5E7EB] cursor-not-allowed"}`}
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
