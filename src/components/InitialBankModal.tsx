import { useState } from "react";
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
import { BankrollService } from "@/lib/bankrollService";
import { toast } from "sonner";

interface InitialBankModalProps {
  open: boolean;
  onClose: (success: boolean) => void;
  mode?: "setup" | "edit";
}

export default function InitialBankModal({
  open,
  onClose,
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value < 0) {
      toast.error("Будь ласка, введіть коректну суму");
      return;
    }
    setIsSubmitting(true);
    try {
      await BankrollService.setInitialBank(currentUser, value, currency, savedRate);
      toast.success(
        `Стартовий банк оновлено: ${value} ${currency === "USD" ? "$" : "₴"}`,
      );
    } catch (err) {
      toast.error("Помилка при збереженні банку");
      if (import.meta.env.DEV) console.error("[Bank] Save error:", err);
    } finally {
      setIsSubmitting(false);
    }
    onClose(true);
  };

  const handleClose = () => {
    onClose(false);
  };

  const handleReset = () => {
    setAmount("0");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="initial-bank-dialog">
        {/* Header */}
        <DialogHeader className="initial-bank-header">
          <DialogTitle>Редагувати стартовий банк</DialogTitle>
          <DialogDescription>
            Змініть ваш стартовий банк для точного відстеження прогресу
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="initial-bank-body">
          <div>
            <Label className="initial-bank-label">
              Стартовий банк ({currency === "USD" ? "$" : "₴"})
            </Label>
            <div className="initial-bank-row">
              <div className="initial-bank-currency">
                <button
                  type="button"
                  onClick={() => setCurrency("UAH")}
                  className={currency === "UAH" ? "is-active" : ""}
                >
                  ₴
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={currency === "USD" ? "is-active" : ""}
                >
                  $
                </button>
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="initial-bank-input"
                autoFocus
              />
            </div>
            {currency === "USD" && amount && parseFloat(amount) > 0 && (
              <p className="initial-bank-hint">
                ≈ {(parseFloat(amount) * savedRate).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} ₴ за курсом {savedRate} ₴/$
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="initial-bank-reset"
          >
            Скинути до 0
          </Button>
        </div>

        {/* Footer */}
        <DialogFooter className="initial-bank-footer">
          <Button
            variant="outline"
            onClick={handleClose}
            className="initial-bank-cancel"
          >
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="initial-bank-submit"
          >
            {isSubmitting ? "Збереження..." : "Оновити"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
