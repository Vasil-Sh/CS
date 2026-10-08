import { useId, useRef, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Info, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { proxyLogoUrl } from "@/lib/logoProxy";
import "./AddToRiskyTeamsModal.css";

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
  game: string;
  initialTeam?: string;
  team1Risky: boolean;
  team2Risky: boolean;
  team1Existing: ExistingTeamInfo | null;
  team2Existing: ExistingTeamInfo | null;
  onSaved: () => void;
}

const STATUS_OPTIONS = [
  {
    value: "БАН",
    tone: "red",
    hint: "Команда позначена як виключена з розгляду.",
  },
  {
    value: "Ризиковані",
    tone: "orange",
    hint: "Звертайте увагу на збережені застереження.",
  },
  {
    value: "Нестабільні",
    tone: "red",
    hint: "Результати команди потребують додаткової перевірки.",
  },
  {
    value: "Обережно",
    tone: "amber",
    hint: "Перегляньте нотатку перед наступним рішенням.",
  },
  {
    value: "Під питанням",
    tone: "amber",
    hint: "Потрібне додаткове спостереження.",
  },
  {
    value: "Стабільні",
    tone: "blue",
    hint: "Позначка за спостереженнями, а не гарантія результату.",
  },
  {
    value: "Надійна",
    tone: "green",
    hint: "Позначка за спостереженнями, а не гарантія результату.",
  },
  { value: "Неоцінена", tone: "gray", hint: "Оцінку команди ще не визначено." },
] as const;

const GAME_OPTIONS = [
  { value: "CS", label: "CS2", iconSrc: "/assets/team-placeholder-cs2.svg" },
  {
    value: "Дота",
    label: "Dota 2",
    iconSrc: "/assets/team-placeholder-dota.svg",
  },
] as const;

interface TeamDraft {
  status: string;
  game: string;
  notes: string;
}

function storageGame(game: string) {
  return ["dota2", "dota 2", "дота"].includes(game.toLowerCase())
    ? "Дота"
    : "CS";
}

function makeDraft(existing: ExistingTeamInfo | null, game: string): TeamDraft {
  return {
    status: existing?.status || "Під питанням",
    game: storageGame(existing?.game || game),
    notes: existing?.notes || "",
  };
}

function TeamLogo({ team, game }: { team: TeamInfo; game: string }) {
  const [failed, setFailed] = useState(false);
  const logo = proxyLogoUrl(team.logo, game);

  return logo && !failed ? (
    <img
      className="team-note__logo"
      src={logo}
      alt=""
      onError={() => setFailed(true)}
    />
  ) : (
    <span
      className="team-note__logo team-note__logo--fallback"
      aria-hidden="true"
    >
      {team.name.charAt(0).toUpperCase()}
    </span>
  );
}

function TeamNoteContent(props: AddToRiskyTeamsModalProps) {
  const { team1, team2, onClose, onSaved } = props;
  const id = useId();
  const [selectedTeam, setSelectedTeam] = useState(() => {
    if (props.initialTeam === team1.name || props.initialTeam === team2.name) {
      return props.initialTeam;
    }
    return props.team1Risky && !props.team2Risky ? team2.name : team1.name;
  });
  // Keep each team's unsaved changes separate while switching between the cards.
  const [drafts, setDrafts] = useState<Record<string, TeamDraft>>(() => ({
    [team1.name]: makeDraft(props.team1Existing, props.game),
    [team2.name]: makeDraft(props.team2Existing, props.game),
  }));
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);
  const draft = drafts[selectedTeam];
  const selectedStatus = STATUS_OPTIONS.find(
    (option) => option.value === draft.status,
  );
  const isEditingExisting =
    selectedTeam === team1.name ? props.team1Risky : props.team2Risky;

  const updateDraft = (patch: Partial<TeamDraft>) => {
    setDrafts((current) => ({
      ...current,
      [selectedTeam]: { ...current[selectedTeam], ...patch },
    }));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    try {
      const entry = {
        name: selectedTeam,
        game: draft.game,
        status: draft.status || "Під питанням",
        notes: draft.notes.trim(),
      };
      let teams: Array<{
        name: string;
        game: string;
        status: string;
        notes: string;
      }> = [];
      const saved = localStorage.getItem("admin_risky_teams");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed)) throw new Error("Invalid team list");
        teams = parsed;
      }
      const existingIndex = teams.findIndex(
        (team) => team.name.toLowerCase() === selectedTeam.toLowerCase(),
      );
      if (existingIndex >= 0) {
        teams[existingIndex] = { ...teams[existingIndex], ...entry };
      } else {
        teams.push(entry);
      }
      localStorage.setItem("admin_risky_teams", JSON.stringify(teams));

      // Preserve the existing local-first persistence and API contract.
      try {
        const { api } = await import("@/lib/apiClient");
        if (existingIndex >= 0) {
          await api.put(
            `/risky-teams/${encodeURIComponent(selectedTeam)}`,
            entry,
          );
        } else {
          await api.post("/risky-teams", entry);
        }
      } catch {
        // The saved local entry remains available when backend sync fails.
      }

      toast.success(
        `Примітку до «${selectedTeam}» ${isEditingExisting ? "оновлено" : "збережено"}.`,
      );
      onSaved();
      onClose();
    } catch {
      toast.error("Не вдалося зберегти примітку. Спробуйте ще раз.");
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <DialogContent
      className="team-note"
      hideCloseButton
      onEscapeKeyDown={(event) => {
        if (saving) event.preventDefault();
      }}
      onPointerDownOutside={(event) => {
        if (saving) event.preventDefault();
      }}
    >
      <header className="team-note__header">
        <DialogTitle className="team-note__title">
          Примітка до команди
        </DialogTitle>
        <DialogDescription className="team-note__description">
          Статус і нотатка з’являться біля матчів команди.
        </DialogDescription>
        <button
          type="button"
          className="team-note__close"
          onClick={onClose}
          disabled={saving}
          aria-label="Закрити"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </header>

      <form
        className="team-note__form"
        onSubmit={handleSave}
        aria-busy={saving}
      >
        <div className="team-note__body">
          <fieldset className="team-note__teams" disabled={saving}>
            <legend className="team-note__label">Команда</legend>
            <div className="team-note__team-grid">
              {[team1, team2].map((team, index) => {
                const selected = selectedTeam === team.name;
                const existing =
                  index === 0 ? props.team1Risky : props.team2Risky;
                return (
                  <label key={team.name} className="team-note__choice">
                    <input
                      className="sr-only"
                      type="radio"
                      name={`${id}-team`}
                      value={team.name}
                      checked={selected}
                      onChange={() => setSelectedTeam(team.name)}
                      aria-label={team.name}
                    />
                    <span className="team-note__team-card">
                      <TeamLogo team={team} game={props.game} />
                      <span className="team-note__team-copy">
                        <strong>{team.name}</strong>
                        <span>
                          {selected
                            ? "Обрана команда"
                            : existing
                              ? "Є примітка"
                              : "Обрати"}
                        </span>
                      </span>
                      {selected && (
                        <span className="team-note__selected">
                          <Check
                            size={14}
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="team-note__settings">
            <div className="team-note__field">
              <label className="team-note__label" htmlFor={`${id}-status`}>
                Статус
              </label>
              <Select
                value={draft.status}
                onValueChange={(status) => updateDraft({ status })}
                disabled={saving}
              >
                <SelectTrigger
                  id={`${id}-status`}
                  className="team-note__select"
                  aria-describedby={`${id}-status-hint`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="team-note__menu">
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="team-note__option"
                    >
                      <span className="team-note__select-value">
                        <span
                          className={`team-note__dot team-note__dot--${option.tone}`}
                          aria-hidden="true"
                        />
                        {option.value}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="team-note__field">
              <label className="team-note__label" htmlFor={`${id}-game`}>
                Гра
              </label>
              <Select
                value={draft.game}
                onValueChange={(game) => updateDraft({ game })}
                disabled={saving}
              >
                <SelectTrigger id={`${id}-game`} className="team-note__select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="team-note__menu">
                  {GAME_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="team-note__option"
                    >
                      <span className="team-note__select-value">
                        <img
                          src={option.iconSrc}
                          alt=""
                          width={24}
                          height={24}
                        />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p
              className="team-note__hint"
              id={`${id}-status-hint`}
              aria-live="polite"
            >
              {selectedStatus?.hint || "Оберіть статус команди."}
            </p>
          </div>

          <div className="team-note__field">
            <div className="team-note__label-row">
              <label className="team-note__label" htmlFor={`${id}-notes`}>
                Нотатка
              </label>
              <span id={`${id}-optional`}>Необов’язково</span>
            </div>
            <Textarea
              id={`${id}-notes`}
              className="team-note__textarea"
              rows={4}
              value={draft.notes}
              onChange={(event) => updateDraft({ notes: event.target.value })}
              placeholder="На що звернути увагу перед наступним матчем?"
              aria-describedby={`${id}-optional ${id}-scope`}
              disabled={saving}
            />
            <p
              className="team-note__scope"
              id={`${id}-scope`}
              aria-live="polite"
            >
              <Info size={17} aria-hidden="true" />
              <span>Збережеться лише для {selectedTeam}.</span>
            </p>
          </div>
        </div>

        <footer className="team-note__footer">
          <button
            type="button"
            className="team-note__button"
            onClick={onClose}
            disabled={saving}
          >
            Скасувати
          </button>
          <button
            type="submit"
            className="team-note__button team-note__button--primary"
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle
                size={19}
                className="team-note__spinner"
                aria-hidden="true"
              />
            ) : (
              <Check size={19} aria-hidden="true" />
            )}
            {saving
              ? "Збереження…"
              : isEditingExisting
                ? "Оновити примітку"
                : "Зберегти примітку"}
          </button>
        </footer>
      </form>
    </DialogContent>
  );
}

export default function AddToRiskyTeamsModal(props: AddToRiskyTeamsModalProps) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      {props.open && (
        <TeamNoteContent
          key={JSON.stringify([
            props.team1.name,
            props.team2.name,
            props.game,
            props.initialTeam,
          ])}
          {...props}
        />
      )}
    </Dialog>
  );
}
