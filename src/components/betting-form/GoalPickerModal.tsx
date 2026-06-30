import { useState } from 'react';
import { Target, Search, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Goal } from './types';

interface GoalPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  selectedGoalId: string;
  onSelect: (goalId: string) => void;
}

export default function GoalPickerModal({
  open,
  onOpenChange,
  goals,
  selectedGoalId,
  onSelect,
}: GoalPickerModalProps) {
  const [search, setSearch] = useState('');

  const filteredGoals = search.trim()
    ? goals.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : goals;

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  const typeLabels: Record<string, string> = {
    amount: '💰 Сума',
    ladder: '🪜 Драбина',
    roi: '📈 ROI',
    winrate: '🎯 Win Rate',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg w-[95vw] border border-[#E5E7EB] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-100 flex-shrink-0">
              <Target className="h-5 w-5 text-[#2563EB]" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-[#111827]">
                Оберіть ціль
              </DialogTitle>
              <DialogDescription className="text-[#6B7280] mt-0.5">
                {goals.length} активних цілей
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-t border-[#E5E7EB]" />

        <div className="bg-[#F3F4F6] px-5 py-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за назвою..."
              className="pl-10 rounded-xl border-[#E5E7EB] bg-white h-10 text-sm"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Goals list */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-3">
            {/* No goal option */}
            <button
              onClick={() => { onSelect('all'); onOpenChange(false); }}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                selectedGoalId === 'all' || !selectedGoalId
                  ? 'border-[#2563EB] bg-[#EFF6FF]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F3F4F6]">
                <X className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#111827]">Без цілі</p>
              </div>
              {(selectedGoalId === 'all' || !selectedGoalId) && (
                <Check className="h-4 w-4 text-[#2563EB]" strokeWidth={2.5} />
              )}
            </button>

            {filteredGoals.map((goal) => {
              const isSelected = goal.id === selectedGoalId;
              return (
                <button
                  key={goal.id}
                  onClick={() => { onSelect(goal.id); onOpenChange(false); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#EFF6FF]'
                      : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    goal.status === 'completed' ? 'bg-[#F0FDF4]' : 'bg-[#EFF6FF]'
                  }`}>
                    <Target className={`h-4 w-4 ${
                      goal.status === 'completed' ? 'text-[#16A34A]' : 'text-[#3B82F6]'
                    }`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{goal.name}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {typeLabels[goal.type] || goal.type}
                      {goal.type === 'amount' && goal.currentAmount !== undefined && ` · ${goal.currentAmount} / ${goal.targetAmount}`}
                      {goal.type === 'ladder' && ` · крок ${goal.currentStep ?? 0} / ${goal.totalSteps ?? 0}`}
                      {goal.type === 'roi' && goal.currentROI !== undefined && ` · ${goal.currentROI}% / ${goal.targetROI}%`}
                      {goal.type === 'winrate' && goal.currentWinRate !== undefined && ` · ${goal.currentWinRate}% / ${goal.targetWinRate}%`}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-[#2563EB] flex-shrink-0" strokeWidth={2.5} />
                  )}
                  {goal.isPrimary && (
                    <Badge className="bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded-lg font-medium text-[10px] px-1.5 py-0.5">
                      Основна
                    </Badge>
                  )}
                </button>
              );
            })}

            {filteredGoals.length === 0 && search && (
              <div className="text-center py-8 text-[#9CA3AF] text-sm">
                Нічого не знайдено
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] px-5 py-3">
          <DialogFooter className="gap-2 sm:gap-3 flex items-center">
            {selectedGoal && (
              <div className="text-xs text-[#6B7280] mr-auto self-center bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-[#2563EB]" strokeWidth={1.5} />
                <span>Обрано:</span>
                <span className="font-medium text-[#111827]">{selectedGoal.name}</span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-[#E5E7EB] font-medium"
            >
              Скасувати
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
