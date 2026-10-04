import { Fragment, useState } from "react";
import { Target, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getGroupedBetTypeOptions,
  getBetTypeLabel,
} from "@/lib/displayHelpers";

interface BetTypePickerProps {
  value: string;
  format: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

/**
 * Button + modal picker for the bet type ("Тип прогнозу").
 * Reused by the compact single-entry form.
 */
export default function BetTypePicker({
  value,
  format,
  disabled = false,
  placeholder = "Оберіть тип прогнозу",
  onChange,
}: BetTypePickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(1); // 1=Основне, 2+=Карта N
  const [temp, setTemp] = useState(value);

  const grouped = getGroupedBetTypeOptions(format);
  const maxMaps =
    format === "BO5"
      ? 5
      : format === "BO3"
        ? 3
        : format === "BO1"
          ? 1
          : 3;

  const openModal = () => {
    setTemp(value);
    // Auto-detect tab from betType (e.g. Map1_X → tab 2)
    const mapMatch = value?.match(/^Map(\d+)_/);
    setTab(mapMatch ? parseInt(mapMatch[1], 10) + 1 : 1);
    setOpen(true);
  };

  const save = () => {
    onChange(temp);
    setOpen(false);
  };

  const renderGroup = (group: {
    category: string;
    options: { value: string; label: string }[];
  }) => {
    const safeValue = group.options.some((o) => o.value === temp)
      ? temp
      : undefined;
    const isGroupSelected =
      temp && group.options.some((o) => o.value === temp);
    const selectedBorder = "border-green-500 bg-green-50";
    const defaultBorder = "border-gray-200/80 bg-white";
    if (group.category.includes("Фора")) {
      const seen = new Set<string>();
      const negs = group.options.filter(
        (o) => o.label.includes("-") && !seen.has(o.label) && seen.add(o.label),
      );
      const poss = group.options.filter(
        (o) => o.label.includes("+") && !seen.has(o.label) && seen.add(o.label),
      );
      return (
        <div
          className={`rounded-xl border shadow-sm p-3 ${isGroupSelected ? selectedBorder : defaultBorder}`}
        >
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            {group.category}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={safeValue} onValueChange={(v) => setTemp(v || "")}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800">
                <SelectValue placeholder="Мінус" />
              </SelectTrigger>
              <SelectContent className="text-gray-800">
                {negs.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-gray-800"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={safeValue} onValueChange={(v) => setTemp(v || "")}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800">
                <SelectValue placeholder="Плюс" />
              </SelectTrigger>
              <SelectContent className="text-gray-800">
                {poss.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-gray-800"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    if (group.category.includes("Тотал")) {
      const unders = group.options.filter((o) => o.label.includes("Менше"));
      const overs = group.options.filter((o) => o.label.includes("Більше"));
      return (
        <div
          className={`rounded-xl border shadow-sm p-3 ${isGroupSelected ? selectedBorder : defaultBorder}`}
        >
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            {group.category}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={safeValue} onValueChange={(v) => setTemp(v || "")}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800">
                <SelectValue placeholder="Менше" />
              </SelectTrigger>
              <SelectContent className="text-gray-800">
                {unders.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-gray-800"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={safeValue} onValueChange={(v) => setTemp(v || "")}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800">
                <SelectValue placeholder="Більше" />
              </SelectTrigger>
              <SelectContent className="text-gray-800">
                {overs.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-gray-800"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    if (group.options.length <= 3) {
      return (
        <div
          className={`rounded-xl border shadow-sm p-3 ${isGroupSelected ? selectedBorder : defaultBorder}`}
        >
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            {group.category}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.options.map((opt) => {
              const isSelected = temp === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTemp(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-primary text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    return (
      <div
        className={`rounded-xl border shadow-sm p-3 ${isGroupSelected ? selectedBorder : defaultBorder}`}
      >
        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          {group.category}
        </div>
        <Select value={safeValue} onValueChange={(v) => setTemp(v || "")}>
          <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800">
            <SelectValue placeholder="Оберіть..." />
          </SelectTrigger>
          <SelectContent className="text-gray-800">
            {group.options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-gray-800"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openModal}
        className={`single-bettype-button ${value ? "is-selected" : ""}`}
      >
        <span className="single-bettype-label">
          {value ? getBetTypeLabel(value, format) : placeholder}
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="rounded-3xl max-w-xl max-h-[80vh] flex flex-col border border-gray-200 p-0 gap-0"
          hideCloseButton
        >
          <DialogHeader className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
                  <Target className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                </div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Тип прогнозу
                </DialogTitle>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </DialogHeader>
          <div className="border-t border-gray-100" />
          <div className="flex gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto justify-center">
            {[
              { label: "Основне", idx: 1 },
              ...Array.from({ length: maxMaps }, (_, i) => ({
                label: `Карта ${i + 1}`,
                idx: i + 2,
              })),
            ].map((t) => (
              <button
                key={t.idx}
                type="button"
                onClick={() => setTab(t.idx)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${tab === t.idx ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
            {tab === 1 &&
              grouped.main.map((group) => (
                <Fragment key={group.category}>{renderGroup(group)}</Fragment>
              ))}
            {tab >= 2 &&
              (
                grouped.maps.find((m) => m.mapNumber === tab - 1)?.groups ?? []
              ).map((group) => (
                <Fragment key={group.category}>{renderGroup(group)}</Fragment>
              ))}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 flex gap-3 sm:gap-3">
            <button
              type="button"
              onClick={() => setTemp("")}
              className={`px-4 h-11 rounded-2xl border font-medium text-sm transition-colors ${
                temp
                  ? "border-red-200 text-red-500 hover:bg-red-50"
                  : "border-gray-200 text-gray-300 cursor-not-allowed"
              }`}
              disabled={!temp}
            >
              Очистити
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 h-11 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!temp}
              className={`flex-1 h-11 rounded-2xl font-medium text-sm transition-all ${temp ? "bg-primary text-white hover:bg-blue-700 shadow-sm" : "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"}`}
            >
              Зберегти
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
