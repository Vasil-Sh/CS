import { useState, type ReactNode } from "react";
import { Plus, Users, ChevronDown } from "lucide-react";
import BetTypePickerModal from "./BetTypePickerModal";
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
import { getBetTypeLabel } from "@/lib/displayHelpers";

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
  mode?: "all" | "match" | "prediction";
  hideOdds?: boolean;
  hideHeading?: boolean;
  teamOptions?: string[];
  extraPredictionSlot?: ReactNode;
  teamNotes?: ReactNode;
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
  submitErrors?: Record<string, boolean>;
}

export default function BettingFormMatchSection({
  data,
  mode = "all",
  hideOdds = false,
  hideHeading = false,
  teamOptions = [],
  extraPredictionSlot,
  teamNotes,
  isParsing,
  isExpressFromMatches,
  expressEventsCount,
  classes,
  onFieldChange,
  onParseUrl,
  onUrlChange,
  onAddToExpress,
  submitErrors = {},
}: BettingFormMatchSectionProps) {
  const isExpress = data.betCategory === "Експрес";
  // Always show required markers on the main form (not when adding events to express)
  const showRequired = !isExpress || expressEventsCount === 0;
  const err = (field: string) => {
    // Only highlight if error is set AND field is still empty/invalid
    if (!submitErrors[field]) return "";
    const val = (data as unknown as Record<string, unknown>)[field];
    if (field === "odds") {
      const n = parseFloat(String(val || ""));
      if (!isNaN(n) && n > 1) return "";
    } else {
      if (val && String(val).trim() !== "") return "";
    }
    return "border-red-500 bg-red-50 ring-1 ring-red-500";
  };
  const [betModalOpen, setBetModalOpen] = useState(false);
  const openBetModal = () => setBetModalOpen(true);
  return (
    <>
      <div className="record-match-fields space-y-4">
        {mode !== "prediction" && (
          <>
            {!hideHeading && (
              <h3 className={classes.sectionTitle}>
                <Users className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
                Матч і прогноз
              </h3>
            )}

            {/* Match URL */}
            <div className="record-url-field space-y-1.5">
              <Label
                htmlFor="matchUrl"
                className={`${classes.label} flex items-center gap-2`}
              >
                Посилання на матч{" "}
                <span className="font-normal text-gray-400">
                  (необов&apos;язково)
                </span>
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
            </div>

            <div className="record-form-divider border-t border-gray-100 -mx-6" />

            <div className="record-team-fields grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5" id="team1-wrapper">
                <Label htmlFor="team1" className={classes.label}>
                  Команда 1{" "}
                  {showRequired && <span className="text-red-500">*</span>}
                </Label>
                <div className="record-team-control flex items-center gap-2">
                  <img
                    src={
                      data.logoTeam1 ||
                      (data.game === "Dota2"
                        ? "/assets/team-placeholder-dota.svg"
                        : "/assets/team-placeholder-cs2.svg")
                    }
                    alt={data.team1 || "Team 1"}
                    className="h-9 w-9 rounded-xl object-contain flex-shrink-0"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      if (
                        data.game === "Dota2" &&
                        !t.src.includes("team-placeholder-dota")
                      ) {
                        t.src = "/assets/team-placeholder-dota.svg";
                      } else if (
                        data.game === "CS2" &&
                        !t.src.includes("team-placeholder-cs2")
                      ) {
                        t.src = "/assets/team-placeholder-cs2.svg";
                      } else if (!t.src.includes("team-placeholder")) {
                        t.src = "/assets/team-placeholder-cs2.svg";
                      } else {
                        t.style.display = "none";
                      }
                    }}
                  />
                  <Input
                    id="team1"
                    list="record-team-options"
                    value={data.team1}
                    onChange={(e) => onFieldChange("team1", e.target.value)}
                    placeholder={data.game === "CS2" ? "NAVI" : "Team Spirit"}
                    required={
                      !isExpress || (isExpress && expressEventsCount === 0)
                    }
                    className={`${classes.input} ${err("team1")}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="team2" className={classes.label}>
                  Команда 2{" "}
                  {showRequired && <span className="text-red-500">*</span>}
                </Label>
                <div className="record-team-control flex items-center gap-2">
                  <img
                    src={
                      data.logoTeam2 ||
                      (data.game === "Dota2"
                        ? "/assets/team-placeholder-dota.svg"
                        : "/assets/team-placeholder-cs2.svg")
                    }
                    alt={data.team2 || "Team 2"}
                    className="h-9 w-9 rounded-xl object-contain flex-shrink-0"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      if (
                        data.game === "Dota2" &&
                        !t.src.includes("team-placeholder-dota")
                      ) {
                        t.src = "/assets/team-placeholder-dota.svg";
                      } else if (
                        data.game === "CS2" &&
                        !t.src.includes("team-placeholder-cs2")
                      ) {
                        t.src = "/assets/team-placeholder-cs2.svg";
                      } else if (!t.src.includes("team-placeholder")) {
                        t.src = "/assets/team-placeholder-cs2.svg";
                      } else {
                        t.style.display = "none";
                      }
                    }}
                  />
                  <Input
                    id="team2"
                    list="record-team-options"
                    value={data.team2}
                    onChange={(e) => onFieldChange("team2", e.target.value)}
                    placeholder={data.game === "CS2" ? "G2" : "OG"}
                    required={
                      !isExpress || (isExpress && expressEventsCount === 0)
                    }
                    className={`${classes.input} ${err("team2")}`}
                  />
                </div>
              </div>
            </div>

            <datalist id="record-team-options">
              {[...new Set(teamOptions)].map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <div className="record-form-divider border-t border-gray-100 -mx-6" />
          </>
        )}
        {teamNotes}

        {/* Bet type + Selection — swapped: Selection left, Bet type center */}
        {mode !== "match" && (
          <div
            className={`entry-prediction-row ${hideOdds ? "wizard-prediction-fields" : ""}`}
          >
            <div className="record-selection-field flex-[2] space-y-1.5">
              <Label htmlFor="record-selection" className={classes.label}>
                Вибір команди{" "}
                {showRequired && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={data.selection}
                onValueChange={(value) => onFieldChange("selection", value)}
                disabled={!data.team1 || !data.team2}
              >
                <SelectTrigger
                  id="record-selection"
                  className={`${classes.selectTrigger} ${err("selection")}`}
                >
                  {data.selection && (
                    <img
                      className="record-selection-logo"
                      src={
                        data.selection === data.team1
                          ? data.logoTeam1 || "/assets/team-placeholder.svg"
                          : data.logoTeam2 || "/assets/team-placeholder.svg"
                      }
                      alt=""
                    />
                  )}
                  <SelectValue
                    placeholder={
                      data.team1 && data.team2
                        ? "Хто переможе?"
                        : "Оберіть команду"
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
            <div className="record-market-field flex-[2] space-y-1.5">
              <Label htmlFor="record-market" className={classes.label}>
                Тип прогнозу{" "}
                {showRequired && <span className="text-red-500">*</span>}
              </Label>
              <button
                type="button"
                disabled={!data.selection}
                onClick={openBetModal}
                id="record-market"
                title={
                  !data.selection
                    ? "Спочатку оберіть команду"
                    : data.betType
                      ? getBetTypeLabel(data.betType, data.format)
                      : "Оберіть тип прогнозу"
                }
                className={`record-market-trigger w-full h-11 rounded-2xl border font-medium text-sm transition-colors text-center px-4 ${
                  !data.selection
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : data.betType
                      ? `border-primary bg-blue-50 text-primary hover:bg-blue-100 ${submitErrors.betType ? "border-red-500 bg-red-50 text-red-600" : ""}`
                      : `border-primary bg-primary text-white hover:bg-blue-700 ${submitErrors.betType ? "bg-red-500 border-red-500" : ""}`
                }`}
              >
                <span>
                  {data.betType
                    ? getBetTypeLabel(data.betType, data.format)
                    : "Оберіть прогноз"}
                </span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
            </div>
            {!hideOdds && (
              <div className="record-odds-field flex-1 space-y-1.5">
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
                  required={
                    !isExpress || (isExpress && expressEventsCount === 0)
                  }
                  className={`${classes.input} ${err("odds")}`}
                />
              </div>
            )}
            {extraPredictionSlot && (
              <div className="record-extra-prediction-field flex-1">
                {extraPredictionSlot}
              </div>
            )}
          </div>
        )}

        {/* Show "Add event to express" button ONLY when NOT pre-filled from matches */}
        {mode !== "match" && isExpress && !isExpressFromMatches && (
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

      {betModalOpen && (
        <BetTypePickerModal
          value={data.betType}
          format={data.format}
          onSave={(value) => onFieldChange("betType", value)}
          onClose={() => setBetModalOpen(false)}
        />
      )}
    </>
  );
}
