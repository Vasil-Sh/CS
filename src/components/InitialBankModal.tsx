import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, TrendingUp, Target, BarChart3, X } from 'lucide-react';
import { BankrollService } from '@/lib/bankrollService';
import { toast } from 'sonner';

interface InitialBankModalProps {
  open: boolean;
  onClose: (success: boolean) => void;
  mode?: 'setup' | 'edit'; // setup - перший раз, edit - редагування
}

export default function InitialBankModal({ open, onClose, mode = 'setup' }: InitialBankModalProps) {
  // ВИПРАВЛЕННЯ: Використовуємо той самий ключ 'username', що й Analytics та MyBets
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

  const handleClose = () => {
    onClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] rounded-[32px] border-2 border-[#E8E6DC] shadow-[0_16px_48px_rgba(0,0,0,0.12)] bg-white p-0 gap-0">
        {/* Custom Close Button - RonDesignLab style */}
        <button
          onClick={handleClose}
          className="absolute right-6 top-6 p-2.5 rounded-[16px] bg-[#F5F5F3] hover:bg-[#E8E6DC] transition-all duration-300 z-50 group"
        >
          <X className="h-5 w-5 text-[#6B6B6B] group-hover:text-[#4A4A4A] transition-colors" strokeWidth={1.5} />
        </button>

        <DialogHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8 rounded-t-[30px]">
          <DialogTitle className="flex items-center gap-4 text-[32px] font-normal text-[#2A2A2A]">
            <div className="p-4 bg-[#F4E157] rounded-[24px] shadow-[0_4px_16px_rgba(244,225,87,0.4)]">
              <Wallet className="h-7 w-7 text-[#2A2A2A]" strokeWidth={1.5} />
            </div>
            {mode === 'edit' ? 'Редагувати стартовий банк' : 'Налаштування стартового банку'}
          </DialogTitle>
          <DialogDescription className="text-[17px] pt-3 font-normal text-[#5A5A5A] ml-[76px]">
            {mode === 'edit' 
              ? 'Змініть ваш стартовий банк для точного відстеження прогресу'
              : 'Введіть ваш стартовий банк для точного відстеження прогресу та аналітики'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-8">
          {/* Input Field */}
          <div className="space-y-3">
            <Label htmlFor="initialBank" className="text-[15px] font-medium text-[#5A5A5A] uppercase tracking-wider">
              Стартовий банк (₴)
            </Label>
            <Input
              id="initialBank"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="text-2xl h-16 rounded-[20px] border-2 border-[#D4D2C8] hover:border-[#C4C2B8] focus:border-[#F4E157] transition-colors font-normal bg-white text-[#2A2A2A]"
              autoFocus
            />
          </div>

          {mode === 'setup' && (
            <>
              {/* Benefits */}
              <div className="bg-[#F5F5F3] rounded-[24px] p-6 space-y-4 border-2 border-[#E8E6DC]">
                <p className="text-[15px] font-medium text-[#2A2A2A] mb-4 uppercase tracking-wider">Це допоможе вам:</p>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-[16px] border-2 border-[#E8E6DC]">
                    <BarChart3 className="h-5 w-5 text-[#2196F3]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[17px] font-medium text-[#2A2A2A]">Відстежувати поточний банк</p>
                    <p className="text-[15px] text-[#5A5A5A] font-normal mt-1">Бачити реальний стан ваших коштів</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-[16px] border-2 border-[#E8E6DC]">
                    <TrendingUp className="h-5 w-5 text-[#4CAF50]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[17px] font-medium text-[#2A2A2A]">Розраховувати ROI</p>
                    <p className="text-[15px] text-[#5A5A5A] font-normal mt-1">Точний відсоток прибутковості</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-[16px] border-2 border-[#E8E6DC]">
                    <Target className="h-5 w-5 text-[#8b5cf6]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[17px] font-medium text-[#2A2A2A]">Планувати лесенки</p>
                    <p className="text-[15px] text-[#5A5A5A] font-normal mt-1">Автоматичний розрахунок розміру ставок</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <p className="text-[15px] text-[#7A7A7A] text-center font-normal">
                💡 Ви зможете змінити цю суму пізніше
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-3 p-8 pt-0">
          {mode === 'setup' && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="rounded-[20px] border-2 border-[#D4D2C8] hover:bg-[#F5F5F3] hover:border-[#C4C2B8] font-medium h-14 px-6 text-[16px] transition-all duration-300 text-[#2A2A2A]"
            >
              Пропустити
            </Button>
          )}
          {mode === 'edit' && (
            <Button
              variant="outline"
              onClick={handleClose}
              className="rounded-[20px] border-2 border-[#D4D2C8] hover:bg-[#F5F5F3] hover:border-[#C4C2B8] font-medium h-14 px-6 text-[16px] transition-all duration-300 text-[#2A2A2A]"
            >
              Скасувати
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            className="rounded-[20px] bg-[#F4E157] hover:bg-[#E8D54A] text-[#2A2A2A] font-medium h-14 px-6 text-[16px] shadow-[0_4px_16px_rgba(244,225,87,0.3)] hover:shadow-[0_6px_20px_rgba(244,225,87,0.4)] transition-all duration-300"
          >
            <Wallet className="h-5 w-5 mr-2" strokeWidth={1.5} />
            {mode === 'edit' ? 'Оновити' : 'Почати'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}