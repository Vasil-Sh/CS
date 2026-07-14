import { useState } from "react";
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
import { ShieldAlert, Save } from "lucide-react";
import { toast } from "sonner";

interface TeamInfo {
  name: string;
  logo?: string | null;
}

interface AddToRiskyTeamsModalProps {
  open: boolean;
  onClose: () => void;
  team1: TeamInfo;
  team2: TeamInfo;
  onSaved: () => void; // callback to refresh risky teams in parent
}

const STATUS_OPTIONS = [
  { value: "БАН", label: "🔴 БАН", color: "text-red-600" },
  { value: "Нестабільні", label: "🟠 Нестабільні", color: "text-orange-500" },
  { value: "Обережно", label: "🟡 Обережно", color: "text-yellow-600" },
  { value: "Рідко", label: "🔵 Рідко", color: "text-blue-600" },
] as const;

const GAME_OPTIONS = [
  { value: "CS", label: "CS2", iconSrc: "/assets/team-placeholder.svg" },
  {
    value: "Дота",
    label: "Dota 2",
    iconSrc: "/assets/team-placeholder-dota.svg",
  },
] as const;

export default function AddToRiskyTeamsModal({
  open,
  onClose,
  team1,
  team2,
  onSaved,
}: AddToRiskyTeamsModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>(team1.name);
  const [status, setStatus] = useState<string>("Обережно");
  const [game, setGame] = useState<string>("CS");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fallback to defaults if state wasn't initialized properly
      const teamName = selectedTeam || team1.name;
      const teamStatus = status || "Обережно";

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
      const exists = teams.some(
        (t) => t.name.toLowerCase() === teamName.toLowerCase(),
      );
      if (exists) {
        toast.error(`Команда "${teamName}" вже є у списку ризикованих`);
        setSaving(false);
        return;
      }

      // Add new entry
      teams.push({
        name: teamName,
        game,
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
          game,
          status: teamStatus,
          notes: notes.trim(),
        });
      } catch {
        // Backend sync failed — data is saved locally
      }

      toast.success(`"${teamName}" додано до ризикованих команд!`);
      onSaved();
      onClose();
      setNotes("");
      setStatus("Обережно");
      setGame("CS");
    } catch (err) {
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
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Додати до ризикованих команд
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5 font-normal">
                Додайте команду до списку ризикованих
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 space-y-5">
          {/* Team cards */}
          <div className="grid grid-cols-2 gap-3">
            {[team1, team2].map((team) => (
              <button
                key={team.name}
                onClick={() => setSelectedTeam(team.name)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedTeam === team.name
                    ? "border-primary bg-blue-50 shadow-[0_0_0_2px_rgba(68,122,252,0.2)]"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                }`}
              >
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`text-sm font-semibold truncate ${
                    selectedTeam === team.name
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {team.name}
                </span>
              </button>
            ))}
          </div>

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
                    onClick={() => setGame(opt.value)}
                    className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border-2 transition-all text-sm font-semibold ${
                      game === opt.value
                        ? "border-primary bg-blue-50 text-gray-900 shadow-[0_0_0_2px_rgba(68,122,252,0.2)]"
                        : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white"
                    }`}
                  >
                    <img
                      src={opt.iconSrc}
                      alt={opt.label}
                      className={`w-6 h-6 object-contain ${game !== opt.value ? "opacity-50" : ""}`}
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

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-2xl bg-primary hover:bg-[#3568e0] text-white font-semibold text-base transition-all"
          >
            <Save className="h-4 w-4 mr-2" strokeWidth={2} />
            {saving ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
