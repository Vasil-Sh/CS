import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { BankrollService } from '@/lib/bankrollService';
import { toast } from 'sonner';

interface InitialBankModalProps {
  open: boolean;
  onClose: (success: boolean) => void;
  mode?: 'setup' | 'edit'; // setup - перший раз, edit - редагування
}

export default function InitialBankModal({ open, onClose, mode = 'setup' }: InitialBankModalProps) {
  const currentUser = localStorage.getItem('username') || '';
  const existingBank = BankrollService.getBankrollData(currentUser);
  const [amount, setAmount] = useState<string>(existingBank?.initialBank.toString() || '1000');

  const handleSubmit = () => {
    const bankAmount = parseFloat(amount);

    if (!bankAmount || bankAmount < 0) {
      toast.error('Будь ласка, введіть коректну суму');
      return;
    }

    if (mode === 'edit' && existingBank) {
      BankrollService.updateInitialBank(currentUser, bankAmount);
      toast.success(`Стартовий банк оновлено: ${bankAmount} ₴`);
    } else {
      BankrollService.setInitialBank(currentUser, bankAmount);
      toast.success(`Стартовий банк встановлено: ${bankAmount} ₴`);
    }
    
    onClose(true);
  };

  const handleSkip = () => {
    if (mode === 'setup') {
      BankrollService.setInitialBank(currentUser, 0);
      toast.info('Ви можете встановити стартовий банк пізніше');
    }
    onClose(false);
  };

  const handleClose = () => {
    onClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl border border-[#E5E7EB] shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-white p-0 gap-0">
        <DialogHeader className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-6 rounded-t-2xl">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-[#111827]">
            <div className="p-2.5 bg-[#111827] rounded-xl">
              <Wallet className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            {mode === 'edit' ? 'Редагувати стартовий банк' : 'Налаштування стартового банку'}
          </DialogTitle>
          <DialogDescription className="text-sm pt-2 text-[#6B7280] ml-[52px]">
            {mode === 'edit' 
              ? 'Змініть ваш стартовий банк для точного відстеження прогресу'
              : 'Введіть ваш стартовий банк для точного відстеження прогресу та аналітики'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 p-6">
          {/* Input Field */}
          <div className="space-y-2">
            <Label htmlFor="initialBank" className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Стартовий банк (₴)
            </Label>
            <Input
              id="initialBank"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="text-xl h-14 rounded-xl border border-[#D1D5DB] hover:border-[#9CA3AF] focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-colors font-medium bg-white text-[#111827]"
              autoFocus
            />
          </div>

          {mode === 'setup' && (
            <>
              {/* Benefits */}
              <div className="bg-[#F9FAFB] rounded-xl p-5 space-y-3.5 border border-[#E5E7EB]">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-3">Це допоможе вам:</p>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-[#E5E7EB]">
                    <BarChart3 className="h-4 w-4 text-[#3B82F6]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Відстежувати поточний банк</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Бачити реальний стан ваших коштів</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-[#E5E7EB]">
                    <TrendingUp className="h-4 w-4 text-[#22C55E]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Розраховувати ROI</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Точний відсоток прибутковості</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-[#E5E7EB]">
                    <Target className="h-4 w-4 text-[#8B5CF6]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Планувати лесенки</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Автоматичний розрахунок розміру ставок</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <p className="text-xs text-[#9CA3AF] text-center">
                💡 Ви зможете змінити цю суму пізніше
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-3 p-6 pt-0">
          {mode === 'setup' && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="rounded-xl border border-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-[#9CA3AF] font-medium h-11 px-5 text-sm transition-all duration-200 text-[#374151]"
            >
              Пропустити
            </Button>
          )}
          {mode === 'edit' && (
            <Button
              variant="outline"
              onClick={handleClose}
              className="rounded-xl border border-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-[#9CA3AF] font-medium h-11 px-5 text-sm transition-all duration-200 text-[#374151]"
            >
              Скасувати
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            className="rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-11 px-5 text-sm shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Wallet className="h-4 w-4 mr-2" strokeWidth={1.5} />
            {mode === 'edit' ? 'Оновити' : 'Почати'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}