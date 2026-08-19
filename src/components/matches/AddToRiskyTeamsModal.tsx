import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ShieldAlert, Save, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { proxyLogoUrl } from "@/lib/logoProxy";

interface TeamInfo {
  name: string;
  logo?: string | null;
}

interface ExistingTeamInfo {
  notes: string;
  status: string;
  game?: string;
}

interface AddToRiskyTeamsModalProps {
  open: boolean;
  onClose: () => void;
  team1: TeamInfo;
  team2: TeamInfo;
  game: string; // "CS2" or "Dota2" — current match game
  team1Risky: boolean; // already computed by parent via getTeamRiskInfo
  team2Risky: boolean;
  team1Existing: ExistingTeamInfo | null; // existing data for team1 if already in list
  team2Existing: ExistingTeamInfo | null; // existing data for team2 if already in list
  onSaved: () => void; // callback to refresh risky teams in parent
}

const STATUS_OPTIONS = [
  { value: "БАН", label: "🔴 БАН", color: "text-red-600" },
  { value: "Ризиковані", label: "🟠 Ризиковані", color: "text-orange-500" },
  { value: "Нестабільні", label: "� Нестабільні", color: "text-red-600" },
  { value: "Обережно", label: "🟡 Обережно", color: "text-amber-500" },
  { value: "Під питанням", label: "🟡 Під питанням", color: "text-yellow-600" },
  { value: "Стабільні", label: "🔵 Стабільні", color: "text-blue-600" },
  { value: "Надійна", label: "🟢 Надійна", color: "text-green-600" },
  { value: "Неоцінена", label: "⚪ Неоцінена", color: "text-gray-500" },
] as const;

const GAME_OPTIONS = [
  { value: "CS", label: "CS2", iconSrc: "/assets/team-placeholder-cs2.svg" },
  {
    value: "Дота",
    label: "Dota 2",
    iconSrc: "/assets/team-placeholder-dota.svg",
  },
] as const;

/** Proxy a CDN logo URL through the backend */
const proxyLogo = (url: string | null | undefined, game: string): string | null =>
  proxyLogoUrl(url, game);

export default function AddToRiskyTeamsModal(props: AddToRiskyTeamsModalProps) {
  const {
    open,
    onClose,
    team1,
    team2,
    onSaved,
    team1Risky,
    team2Risky,
    team1Existing,
    team2Existing,
  } = props;
  const gameStorageKey: string = props.game === "Dota2" ? "Дота" : "CS";

  const [selectedTeam, setSelectedTeam] = useState<string>(team1.name);
  const [status, setStatus] = useState<string>("Під питанням");
  const [selectedGame, setSelectedGame] = useState<string>(gameStorageKey);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Use parent's pre-computed risky status — single source of truth.
  const existingTeams = new Set<string>();
  if (team1Risky) existingTeams.add(team1.name.toLowerCase());
  if (team2Risky) existingTeams.add(team2.name.toLowerCase());

  // Get existing data for a team by name
  const getExistingData = (teamName: string): ExistingTeamInfo | null => {
    if (teamName.toLowerCase() === team1.name.toLowerCase())
      return team1Existing;
    if (teamName.toLowerCase() === team2.name.toLowerCase())
      return team2Existing;
    return null;
  };

  // Check if selected team is being edited (already exists)
  const isEditingExisting = existingTeams.has(selectedTeam.toLowerCase());

  // Auto-select team & reset form when modal opens
  useEffect(() => {
    if (!open) return;
    let autoTeam = team1.name;
    if (team1Risky && !team2Risky) {
      autoTeam = team2.name;
    } else if (!team1Risky) {
      autoTeam = team1.name;
    }
    setSelectedTeam(autoTeam);

    // Pre-fill with existing data if the auto-selected team already exists
    const existing = getExistingData(autoTeam);
    if (existing) {
      setStatus(existing.status || "Під питанням");
      setSelectedGame(existing.game || gameStorageKey);
      setNotes(existing.notes || "");
    } else {
      setStatus("Під питанням");
      setSelectedGame(gameStorageKey);
      setNotes("");
    }
  }, [open, team1.name, team2.name, gameStorageKey, team1Risky, team2Risky]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fallback to defaults if state wasn't initialized properly
      const teamName = selectedTeam || team1.name;
      const teamStatus = status || "Під питанням";

      // Load existing risky teams
      let teams: Array<{
        name: string;
        game: string;
        status: string;
        notes: string;
      }> = [];
      try {
        const saved = localStorage.getItem("admin_risky_teams");
        if (saved) teams = JSON.parse(saved);
      } catch {
        /* ignore */
      }

      // Check if team already exists
      const existingIndex = teams.findIndex(
        (t) => t.name.toLowerCase() === teamName.toLowerCase(),
      );

      if (existingIndex >= 0) {
        // Update existing entry
        teams[existingIndex] = {
          ...teams[existingIndex],
          game: selectedGame,
          status: teamStatus,
          notes: notes.trim(),
        };

        // Save to localStorage
        localStorage.setItem("admin_risky_teams", JSON.stringify(teams));

        // Sync update to backend API
        try {
          const { api } = await import("@/lib/apiClient");
          await api.put(`/risky-teams/${encodeURIComponent(teamName)}`, {
            name: teamName,
            game: selectedGame,
            status: teamStatus,
            notes: notes.trim(),
          });
        } catch {
          // Backend sync failed — data is saved locally
        }

        toast.success(`"${teamName}" оновлено!`);
      } else {
        // Add new entry
        teams.push({
          name: teamName,
          game: selectedGame,
          status: teamStatus,
          notes: notes.trim(),
        });

        // Save to localStorage
        localStorage.setItem("admin_risky_teams", JSON.stringify(teams));

        // Sync to backend API
        try {
          const { api } = await import("@/lib/apiClient");
          await api.post("/risky-teams", {
            name: teamName,
            game: selectedGame,
            status: teamStatus,
            notes: notes.trim(),
          });
        } catch {
          // Backend sync failed — data is saved locally
        }

        toast.success(`"${teamName}" додано до ризикованих команд!`);
      }

      onSaved();
      onClose();
      setNotes("");
      setStatus("Під питанням");
      setSelectedGame("CS");
    } catch {
      toast.error("Помилка при збереженні");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl border border-gray-100 bg-white p-0 gap-0 [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
              <ShieldAlert
                className="h-5 w-5 text-blue-500"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-gray-900">
                Додати до ризикованих команд
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5 font-normal">
                Додайте команду до списку ризикованих
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 space-y-5">
          {/* Team cards */}
          <div className="grid grid-cols-2 gap-3">
            {[team1, team2].map((team) => {
              const isAlreadyAdded = existingTeams.has(team.name.toLowerCase());
              const isSelected = selectedTeam === team.name;
              const existingData = getExistingData(team.name);

              // Team already in risky list — show with notes and allow selecting for edit
              if (isAlreadyAdded) {
                return (
                  <button
                    key={team.name}
                    onClick={() => {
                      setSelectedTeam(team.name);
                      // Load existing data into form
                      if (existingData) {
                        setStatus(existingData.status || "Під питанням");
                        setSelectedGame(existingData.game || gameStorageKey);
                        setNotes(existingData.notes || "");
                      }
                    }}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-blue-50 shadow-[0_0_0_2px_rgba(68,122,252,0.2)]"
                        : "border-green-200 bg-green-50/60 hover:border-green-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {team.logo ? (
                        <img
                          src={proxyLogo(team.logo, props.game) || undefined}
                          alt={team.name}
                          className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            (
                              e.target as HTMLImageElement
                            ).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0 ${team.logo ? "hidden" : ""}`}
                      >
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-gray-700 block truncate">
                          {team.name}
                        </span>
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                          {isSelected ? "Редагувати" : "Вже додано"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={team.name}
                  onClick={() => setSelectedTeam(team.name)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-primary bg-blue-50 shadow-[0_0_0_2px_rgba(68,122,252,0.2)]"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                  }`}
                >
                  {team.logo ? (
                    <img
                      src={proxyLogo(team.logo, props.game) || undefined}
                      alt={team.name}
                      className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (
                          e.target as HTMLImageElement
                        ).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0 ${team.logo ? "hidden" : ""}`}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`text-sm font-semibold truncate ${
                      isSelected ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {team.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Warning when both teams already added */}
          {existingTeams.has(team1.name.toLowerCase()) &&
            existingTeams.has(team2.name.toLowerCase()) && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-2xl text-center">
                <p className="text-sm text-green-700 font-medium">
                  Обидві команди вже є у списку ризикованих
                </p>
              </div>
            )}

          {/* Form */}
          <div className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-700 font-medium">
                Статус
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="rounded-lg"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Game — toggle buttons with SVG icons */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-700 font-medium">Гра</Label>
              <div className="grid grid-cols-2 gap-3">
                {GAME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedGame(opt.value)}
                    className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border-2 transition-all text-sm font-semibold ${
                      selectedGame === opt.value
                        ? "border-primary bg-blue-50 text-gray-900 shadow-[0_0_0_2px_rgba(68,122,252,0.2)]"
                        : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white"
                    }`}
                  >
                    <img
                      src={opt.iconSrc}
                      alt={opt.label}
                      className={`w-6 h-6 object-contain ${selectedGame !== opt.value ? "opacity-50" : ""}`}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-700 font-medium">
                Нотатки
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Наприклад: Не ставити на них, коли грають фінал..."
                className="rounded-xl border-gray-200"
              />
            </div>
          </div>

          {/* Save / Update button — always visible (can add or edit) */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-2xl bg-primary hover:bg-[#3568e0] text-white font-semibold text-base transition-all"
          >
            {saving ? (
              "Збереження..."
            ) : isEditingExisting ? (
              <>
                <Save className="h-4 w-4 mr-2" strokeWidth={2} />
                Оновити
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" strokeWidth={2} />
                Зберегти
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
