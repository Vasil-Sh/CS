import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";
import { BankrollService } from "@/lib/bankrollService";
import { UserDataService } from "@/lib/userDataService";
import { toast } from "sonner";

interface InitialBankModalProps {
  open: boolean;
  onClose: (success: boolean) => void;
  mode?: "setup" | "edit";
}

export default function InitialBankModal({
  open,
  onClose,
  mode = "setup",
}: InitialBankModalProps) {
  const currentUser = localStorage.getItem("username") || "";
  const existingBank = BankrollService.getBankrollData(currentUser);
  const savedRate = parseFloat(
    localStorage.getItem("matchiq_exchange_rate") || "41.50",
  );
  const [amount, setAmount] = useState<string>(
    existingBank?.initialBank.toString() || "1000",
  );
  const [currency, setCurrency] = useState<"UAH" | "USD">("UAH");

  const displayAmount =
    currency === "USD"
      ? (parseFloat(amount || "0") * savedRate).toFixed(0)
      : amount;
  const label =
    currency === "USD" ? "Стартовий банк ($)" : "Стартовий банк (₴)";

  const handleSubmit = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value < 0) {
      toast.error("Будь ласка, введіть коректну суму");
      return;
    }
    BankrollService.setInitialBank(currentUser, value, currency, savedRate);
    toast.success(
      `Стартовий банк оновлено: ${value} ${currency === "USD" ? "$" : "₴"}`,
    );
    onClose(true);
  };

  const handleSkip = () => {
    if (mode === "setup") {
      BankrollService.setInitialBank(currentUser, 0);
      toast.info("Ви можете встановити стартовий банк пізніше");
    }
    onClose(false);
  };

  const handleClose = () => {
    onClose(false);
  };

  const handleReset = () => {
    setAmount("0");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-3xl max-w-md border border-[#E5E7EB] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="pt-4 pb-3 px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EFF6FF] rounded-2xl">
              <Wallet className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-[#111827]">
                Редагувати стартовий банк
              </DialogTitle>
              <DialogDescription className="text-sm text-[#6B7280] mt-0.5">
                Змініть ваш стартовий банк для точного відстеження прогресу
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-t border-[#E5E7EB]" />

        {/* Body */}
        <div className="space-y-4 pt-4 pb-4 px-6 bg-[#F3F4F6]">
          <div>
            <Label className="text-base font-medium">
              Стартовий банк ({currency === "USD" ? "$" : "₴"})
            </Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex bg-white rounded-xl p-0.5 border border-[#E5E7EB] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrency("UAH")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${currency === "UAH" ? "bg-[#447afc] text-white shadow-sm" : "text-[#9CA3AF] hover:text-[#6B7280]"}`}
                >
                  ₴
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${currency === "USD" ? "bg-[#447afc] text-white shadow-sm" : "text-[#9CA3AF] hover:text-[#6B7280]"}`}
                >
                  $
                </button>
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 rounded-2xl border-[#E5E7EB] h-11 text-base font-semibold"
                autoFocus
              />
            </div>
            {currency === "USD" && amount && parseFloat(amount) > 0 && (
              <p className="text-xs text-[#6B7280] mt-1.5">
                ≈ {(parseFloat(amount) * savedRate).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} ₴ за курсом {savedRate} ₴/$
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="w-full rounded-xl border-[#E5E7EB] font-medium text-sm"
          >
            Скинути до 0
          </Button>
        </div>

        <div className="border-t border-[#E5E7EB]" />

        {/* Footer */}
        <DialogFooter className="gap-2 pt-3 pb-4 px-6">
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-3xl border border-[#E5E7EB] hover:bg-[#F9FAFB] font-medium h-11 px-5 text-base"
          >
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-3xl bg-[#447afc] hover:bg-[#5b8ffd] text-white font-medium h-11 px-5 text-base shadow-[0_4px_16px_rgba(68,122,252,0.3)]"
          >
            Оновити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
