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
  const currentUser = localStorage.getItem('currentUser') || '';
  const existingBank = BankrollService.getBankrollData(currentUser);
  const [amount, setAmount] = useState<string>(existingBank?.initialBank.toString() || '1000');

  const handleSubmit = () => {
    const bankAmount = parseFloat(amount);

    if (!bankAmount || bankAmount < 0) {
      toast.error('Будь ласка, введіть коректну суму');
      return;
    }

    if (mode === 'edit' && existingBank) {
      // Оновлюємо існуючий банк
      BankrollService.updateInitialBank(currentUser, bankAmount);
      toast.success(`Стартовий банк оновлено: ${bankAmount} ₴`);
    } else {
      // Встановлюємо новий банк
      BankrollService.setInitialBank(currentUser, bankAmount);
      toast.success(`Стартовий банк встановлено: ${bankAmount} ₴`);
    }
    
    onClose(true);
  };

  const handleSkip = () => {
    if (mode === 'setup') {
      // Встановити 0 як початковий банк (віртуальний режим)
      BankrollService.setInitialBank(currentUser, 0);
      toast.info('Ви можете встановити стартовий банк пізніше');
    }
    onClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            {mode === 'edit' ? 'Редагувати стартовий банк' : 'Налаштування стартового банку'}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {mode === 'edit' 
              ? 'Змініть ваш стартовий банк для точного відстеження прогресу'
              : 'Введіть ваш стартовий банк для точного відстеження прогресу та аналітики'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Field */}
          <div className="space-y-3">
            <Label htmlFor="initialBank" className="text-sm font-semibold text-gray-700">
              Стартовий банк (₴)
            </Label>
            <Input
              id="initialBank"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="text-lg h-12 rounded-xl"
              autoFocus
            />
          </div>

          {mode === 'setup' && (
            <>
              {/* Benefits */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">Це допоможе вам:</p>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Відстежувати поточний банк</p>
                    <p className="text-xs text-gray-600">Бачити реальний стан ваших коштів</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Розраховувати ROI</p>
                    <p className="text-xs text-gray-600">Точний відсоток прибутковості</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Планувати лесенки</p>
                    <p className="text-xs text-gray-600">Автоматичний розрахунок розміру ставок</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <p className="text-xs text-gray-500 text-center">
                💡 Ви зможете змінити цю суму пізніше
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {mode === 'setup' && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="rounded-xl"
            >
              Пропустити
            </Button>
          )}
          {mode === 'edit' && (
            <Button
              variant="outline"
              onClick={() => onClose(false)}
              className="rounded-xl"
            >
              Скасувати
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Wallet className="h-4 w-4 mr-2" />
            {mode === 'edit' ? 'Оновити' : 'Почати'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}