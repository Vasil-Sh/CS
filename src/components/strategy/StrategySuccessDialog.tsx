import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Percent, Target, Lightbulb, Shield, Info } from "lucide-react";
import type { CS2Strategy } from "@/types/strategy";
import { getRiskIcon } from "@/lib/strategyHelpers";
import "./StrategySuccessDialog.css";

interface StrategySuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: CS2Strategy | null;
}

export default function StrategySuccessDialog({
  open,
  onOpenChange,
  strategy,
}: StrategySuccessDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ss-dialog">
        <DialogHeader className="ss-header">
          <div className="ss-header-icon">
            <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
          </div>
          <DialogTitle>Вітаємо! Стратегію успішно створено!</DialogTitle>
          <DialogDescription>
            Ваша нова стратегія готова до використання
          </DialogDescription>
        </DialogHeader>

        {strategy && (
          <div className="ss-body">
            <div className="ss-summary">
              <div className="ss-summary-icon">
                {getRiskIcon(strategy.riskLevel)}
              </div>
              <div className="ss-summary-copy">
                <h3>{strategy.name}</h3>
                <p>{strategy.description}</p>
              </div>
            </div>

            <div className="ss-stats">
              <div className="ss-stat">
                <span className="ss-stat-label">
                  <Percent className="h-4 w-4" strokeWidth={1.5} />
                  Очікуваний ROI
                </span>
                <strong>+{strategy.expectedROI}%</strong>
              </div>
              <div className="ss-stat">
                <span className="ss-stat-label">
                  <Target className="h-4 w-4" strokeWidth={1.5} />
                  Критеріїв
                </span>
                <strong>{(strategy.criteria ?? []).length}</strong>
              </div>
            </div>

            <div className="ss-section">
              <h4>
                <Lightbulb className="h-4 w-4" strokeWidth={1.5} />
                Критерії стратегії:
              </h4>
              <ul>
                {(strategy.criteria ?? []).map((criterion, idx) => (
                  <li key={idx}>{criterion}</li>
                ))}
              </ul>
            </div>

            {strategy.activityLimits?.enabled && (
              <div className="ss-stats">
                <div className="ss-stat">
                  <span className="ss-stat-label">
                    <Shield className="h-4 w-4" strokeWidth={1.5} />
                    Блокування після
                  </span>
                  <strong>{strategy.activityLimits.blockAfterLosses} програшів</strong>
                </div>
                <div className="ss-stat">
                  <span className="ss-stat-label">
                    <Shield className="h-4 w-4" strokeWidth={1.5} />
                    Пауза
                  </span>
                  <strong>{strategy.activityLimits.blockDurationMinutes ?? 60} хв</strong>
                </div>
              </div>
            )}

            <div className="ss-next">
              <h4>
                <Info className="h-4 w-4" strokeWidth={1.5} />
                Наступні кроки:
              </h4>
              <ul>
                <li>Встановіть цю стратегію як основну, натиснувши на зірочку</li>
                <li>Почніть використовувати її при створенні нових ставок</li>
                <li>Відстежуйте результати на вкладці "Ефективність"</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="ss-footer">
          <Button onClick={handleClose} className="ss-submit">
            <CheckCircle2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Чудово, зрозуміло!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
