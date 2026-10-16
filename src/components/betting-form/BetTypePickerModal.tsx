import { useState } from "react";
import {
  Target,
  Trophy,
  ChartNoAxesColumnIncreasing,
  Scale,
  Info,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  getGroupedBetTypeOptions,
  getBetTypeLabel,
  type BetTypeGroup,
} from "@/lib/utils/betTypeOptions";
import "./BetTypePickerModal.css";

interface Props {
  value: string;
  format: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

/** Mounted only while open, so each opening starts from the saved value. */
export default function BetTypePickerModal({
  value,
  format,
  onSave,
  onClose,
}: Props) {
  const grouped = getGroupedBetTypeOptions(format);
  const sections = [
    { id: "main", label: "Основне", groups: grouped.main },
    ...grouped.maps.map((map) => ({
      id: `map-${map.mapNumber}`,
      label: `Карта ${map.mapNumber}`,
      groups: map.groups,
    })),
  ];
  const [draft, setDraft] = useState(value);
  const initialMap = value.match(/^Map(\d+)_/);
  const initialTab = initialMap ? `map-${initialMap[1]}` : "main";
  const [tab, setTab] = useState(
    sections.some((s) => s.id === initialTab) ? initialTab : "main",
  );
  const allGroups = sections.flatMap((section) => section.groups);
  const selectedGroup = allGroups.find((group) =>
    group.options.some((option) => option.value === draft),
  );
  const selectedOption = selectedGroup?.options.find(
    (option) => option.value === draft,
  );
  const selectionLabel =
    selectedGroup && selectedOption
      ? selectedGroup.category.includes("Переможець")
        ? getBetTypeLabel(draft, format)
        : `${selectedGroup.category}: ${selectedOption.label}`
      : draft
        ? getBetTypeLabel(draft, format)
        : "Нічого не обрано";
  // Preserve an existing legacy market without replacing its stored identifier.
  const canSave = draft
    ? Boolean(selectedOption) || draft === value
    : Boolean(value);

  function dropdown(
    group: BetTypeGroup,
    label: string,
    options: BetTypeGroup["options"],
  ) {
    const selected = options.some((option) => option.value === draft);
    return (
      <Select value={selected ? draft : ""} onValueChange={setDraft}>
        <SelectTrigger
          aria-label={`${group.category}: ${label}`}
          className="btp-select"
          data-selected={selected}
          disabled={!options.length}
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent className="btp-options">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  function renderGroup(group: BetTypeGroup) {
    const handicap = group.category.includes("Фора");
    const total = group.category.includes("Тотал");
    const Icon = handicap
      ? Scale
      : total
        ? ChartNoAxesColumnIncreasing
        : Trophy;
    // Keep stored T1/T2 aliases selected, while showing each numerical line once.
    const unique = group.options.filter(
      (option, index, options) =>
        option.value === draft ||
        (!options.some(
          (other) => other.label === option.label && other.value === draft,
        ) &&
          options.findIndex((other) => other.label === option.label) === index),
    );
    return (
      <section
        className="btp-group"
        key={group.category}
        aria-label={group.category}
      >
        <Icon className="btp-group-icon" size={23} aria-hidden="true" />
        <div className="btp-group-content">
          <h3>{group.category.replace(/^Карта \d+: /, "")}</h3>
          {handicap || total ? (
            <div className="btp-pair">
              {dropdown(
                group,
                handicap ? "Мінус" : "Менше",
                unique.filter((option) =>
                  handicap
                    ? option.label.includes("-")
                    : option.label.includes("Менше"),
                ),
              )}
              {dropdown(
                group,
                handicap ? "Плюс" : "Більше",
                unique.filter((option) =>
                  handicap
                    ? option.label.includes("+")
                    : option.label.includes("Більше"),
                ),
              )}
            </div>
          ) : (
            <div className="btp-choices">
              {group.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="btp-choice"
                  aria-pressed={draft === option.value}
                  onClick={() => setDraft(option.value)}
                >
                  <span className="btp-radio" aria-hidden="true" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="btp-dialog" hideCloseButton>
        <header className="btp-header">
          <span className="btp-header-icon">
            <Target size={30} aria-hidden="true" />
          </span>
          <div>
            <DialogTitle>Тип прогнозу</DialogTitle>
            <DialogDescription>
              Оберіть ринок для вашого прогнозу
            </DialogDescription>
          </div>
          <button
            type="button"
            className="btp-close"
            aria-label="Закрити вибір прогнозу"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </header>
        <Tabs className="btp-tabs" value={tab} onValueChange={setTab}>
          <TabsList className="btp-tab-list" aria-label="Матч або карта">
            {sections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="btp-tab"
              >
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="btp-body">
            {sections.map((section) => (
              <TabsContent
                key={section.id}
                value={section.id}
                className="btp-panel"
              >
                {section.groups.map(renderGroup)}
              </TabsContent>
            ))}
          </div>
        </Tabs>
        <div className="btp-summary" role="status">
          <Info size={19} aria-hidden="true" />
          <span>
            Обрано: <strong>{selectionLabel}</strong>
          </span>
        </div>
        <footer className="btp-footer">
          <button
            type="button"
            className="btp-clear"
            disabled={!draft}
            onClick={() => setDraft("")}
          >
            <Trash2 size={18} />
            Очистити
          </button>
          <button type="button" className="btp-cancel" onClick={onClose}>
            Скасувати
          </button>
          <button
            type="button"
            className="btp-save"
            disabled={!canSave}
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Зберегти
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
