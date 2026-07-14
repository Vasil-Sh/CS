import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Filter, ListChecks } from "lucide-react";

interface CompactBetModalProps {
  open: boolean;
  onClose: () => void;
  periodFilter: string;
  month: string;
  monthOptions: { value: string; label: string }[];
  betsCount: number;
  rows: React.ReactNode[];
  copyText: string;
  onPeriodChange: (val: string) => void;
  onMonthChange: (val: string) => void;
  onCopy: () => void;
}

export default function CompactBetModal({
  open,
  onClose,
  periodFilter,
  month,
  monthOptions,
  betsCount,
  rows,
  copyText,
  onPeriodChange,
  onMonthChange,
  onCopy,
}: CompactBetModalProps) {
  const label =
    betsCount === 1
      ? "запис"
      : betsCount >= 2 && betsCount <= 4
        ? "записи"
        : "записів";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[40rem] border border-gray-200 rounded-3xl bg-white p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
                  <ListChecks className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                  Стислий список результатів
                </h2>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="border-t border-gray-200" />
        <div className="px-6 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
            <span className="text-sm text-gray-500 font-medium">Період:</span>
            {(
              [
                ["all", "Всі"],
                ["day", "День"],
                ["week", "Тиждень"],
                ["month", "Місяць"],
              ] as const
            ).map(([val, label]) =>
              val === "month" && periodFilter === "month" ? (
                <Select key={val} value={month} onValueChange={onMonthChange}>
                  <SelectTrigger className="rounded-xl border-gray-200 bg-white h-8 w-auto min-w-[130px] text-sm">
                    <SelectValue placeholder="Оберіть місяць" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((mo) => (
                      <SelectItem key={mo.value} value={mo.value}>
                        {mo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <button
                  key={val}
                  onClick={() => {
                    onPeriodChange(val);
                    if (val !== "month") onMonthChange("");
                  }}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    periodFilter === val
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ),
            )}
            <span className="ml-auto text-sm text-gray-400">
              {betsCount} {label}
            </span>
          </div>
        </div>
        <div className="px-4 py-4 max-h-[65vh] overflow-y-auto bg-gray-100">
          {rows.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {rows}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-6 bg-white rounded-2xl inline-block mb-6 shadow-sm border border-gray-200">
                <ListChecks className="h-11 w-11 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-gray-500 text-base">
                Немає завершених ставок для відображення
              </p>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 px-6 py-4 bg-white flex gap-3">
          <Button
            onClick={onCopy}
            disabled={!copyText}
            className="flex-1 rounded-xl bg-primary hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Copy className="h-4 w-4" strokeWidth={1.5} />
            Копіювати
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl"
          >
            Закрити
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}