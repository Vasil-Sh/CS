import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { BankrollService } from '@/lib/bankrollService';
import { toast } from 'sonner';

interface InitialBankModalProps {
  open: boolean;
  onClose: (success: boolean) => void;
  mode?: 'setup' | 'edit';
}

export default function InitialBankModal({ open, onClose, mode = 'setup' }: InitialBankModalProps) {
  const currentUser = localStorage.getItem('username') || '';
  const existingBank = BankrollService.getBankrollData(currentUser);
  const [amount, setAmount] = useState<string>(existingBank?.initialBank.toString() || '1000');

  const handleSubmit = () => {
    const bankAmount = parseFloat(amount);
    if (isNaN(bankAmount) || bankAmount < 0) {
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

  const handleReset = () => {
    setAmount('0');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[480px] rounded-3xl border border-[#E5E7EB] bg-white p-0 gap-0 overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 border-2 border-[#3B82F6] bg-[#EFF6FF] rounded-2xl flex-shrink-0">
              <Wallet className="h-6 w-6 text-[#3B82F6]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#111827] tracking-tight">
                {mode === 'edit' ? 'Редагувати стартовий банк' : 'Налаштування стартового банку'}
              </h2>
              <p className="text-sm text-[#6B7280] mt-0.5">
                {mode === 'edit'
                  ? 'Змініть ваш стартовий банк для точного відстеження прогресу'
                  : 'Введіть ваш стартовий банк для точного відстеження прогресу та аналітики'}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-[#E5E7EB]" />

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="initialBank" className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider pl-1">
              {'Стартовий банк (₴)'}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="initialBank"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 text-2xl h-16 rounded-2xl border-2 border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#3B82F6] focus:ring-0 transition-all duration-200 font-bold bg-[#F9FAFB] text-[#111827] px-5"
                autoFocus
              />
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-16 px-4 rounded-2xl border-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] font-semibold text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0"
                >
                  {'Скинути до 0'}
                </button>
              )}
            </div>
          </div>

          {mode === 'setup' && (
            <div className="bg-[#F9FAFB] rounded-2xl p-5 space-y-4 border border-[#E5E7EB]">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{'Це допоможе вам:'}</p>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white rounded-xl border border-[#E5E7EB] flex-shrink-0">
                  <BarChart3 className="h-4 w-4 text-[#3B82F6]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{'Відстежувати поточний банк'}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{'Бачити реальний стан ваших коштів'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white rounded-xl border border-[#E5E7EB] flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-[#22C55E]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{'Розраховувати ROI'}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{'Точний відсоток прибутковості'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white rounded-xl border border-[#E5E7EB] flex-shrink-0">
                  <Target className="h-4 w-4 text-[#8B5CF6]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{'Планувати лесенки'}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{'Автоматичний розрахунок розміру ставок'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center gap-3">
          {mode === 'setup' && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 rounded-2xl border border-[#D1D5DB] font-semibold h-12 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-all duration-200"
            >
              {'Пропустити'}
            </Button>
          )}
          {mode === 'edit' && (
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 rounded-2xl border border-[#D1D5DB] font-semibold h-12 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-all duration-200"
            >
              {'Скасувати'}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            className="flex-1 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold h-12 text-sm shadow-none hover:shadow-md transition-all duration-200"
          >
            <Wallet className="h-4 w-4 mr-2" strokeWidth={2} />
            {mode === 'edit' ? 'Оновити' : 'Почати'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
