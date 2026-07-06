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
import { ShieldAlert, Save, Crosshair, Shield } from "lucide-react";
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
  { value: "CS", label: "CS2", icon: Crosshair },
  { value: "Дота", label: "Dota 2", icon: Shield },
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
    if (!selectedTeam || !status) return;
    setSaving(true);
    try {
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
        (t) => t.name.toLowerCase() === selectedTeam.toLowerCase(),
      );
      if (exists) {
        toast.error(`Команда "${selectedTeam}" вже є у списку ризикованих`);
        setSaving(false);
        return;
      }

      // Add new entry
      teams.push({
        name: selectedTeam,
        game,
        status,
        notes: notes.trim(),
      });

      // Save to localStorage
      localStorage.setItem("admin_risky_teams", JSON.stringify(teams));

      // Sync to backend API
      try {
        const { api } = await import("@/lib/apiClient");
        await api.post("/risky-teams", {
          name: selectedTeam,
          game,
          status,
          notes: notes.trim(),
        });
      } catch {
        // Backend sync failed — data is saved locally
      }

      toast.success(`"${selectedTeam}" додано до ризикованих команд!`);
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
                    ? "border-[#447afc] bg-[#EFF6FF] shadow-[0_0_0_2px_rgba(68,122,252,0.2)]"
                    : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#D1D5DB] hover:bg-white"
                }`}
              >
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] font-bold text-sm flex-shrink-0">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`text-sm font-semibold truncate ${
                    selectedTeam === team.name
                      ? "text-[#111827]"
                      : "text-[#6B7280]"
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
              <Label className="text-sm text-[#374151] font-medium">
                Статус
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl border-[#E5E7EB]">
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

            {/* Game — toggle buttons with icons */}
            <div className="space-y-2">
              <Label className="text-sm text-[#374151] font-medium">Гра</Label>
              <div className="grid grid-cols-2 gap-3">
                {GAME_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGame(opt.value)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all text-sm font-semibold ${
                        game === opt.value
                          ? "border-[#447afc] bg-[#EFF6FF] text-[#111827] shadow-[0_0_0_2px_rgba(68,122,252,0.2)]"
                          : "border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] hover:border-[#D1D5DB] hover:bg-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm text-[#374151] font-medium">
                Нотатки
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Наприклад: Не ставити на них, коли грають фінал..."
                className="rounded-xl border-[#E5E7EB]"
              />
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving || !selectedTeam || !status}
            className={`w-full h-12 rounded-2xl font-semibold text-base transition-all ${
              !selectedTeam || !status
                ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed hover:bg-[#E5E7EB]"
                : "bg-[#447afc] hover:bg-[#3568e0] text-white"
            }`}
          >
            <Save className="h-4 w-4 mr-2" strokeWidth={2} />
            {saving ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
