import { Calendar, Plus, RotateCcw, ChevronDown, Target } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GoalPickerModal from './GoalPickerModal';
import type { Goal } from './types';

interface FormSettingsData {
  date: string;
  game: 'CS2' | 'Dota2';
  betCategory: string;
  format: string;
  goalId: string;
}

interface BettingFormSettingsProps {
  /** Form data slice */
  data: FormSettingsData;
  isPrefilled: boolean;
  isExpressFromMatches: boolean;
  activeGoals: Goal[];
  /** Style classes from parent */
  classes: {
    input: string;
    selectTrigger: string;
    label: string;
    sectionTitle: string;
  };
  /** Callbacks */
  onClearForm: () => void;
  onFieldChange: <K extends keyof FormSettingsData>(field: K, value: FormSettingsData[K]) => void;
  onCategoryChange: (value: string) => void;
  onGoalSelect: (goalId: string) => void;
}

export default function BettingFormSettings({
  data,
  isPrefilled,
  isExpressFromMatches,
  activeGoals,
  classes,
  onClearForm,
  onFieldChange,
  onCategoryChange,
  onGoalSelect,
}: BettingFormSettingsProps) {
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const selectedGoal = activeGoals.find((g) => g.id === data.goalId);

  const handleGoalSelect = (goalId: string) => {
    if (goalId === 'all') {
      onGoalSelect('all');
    } else {
      onGoalSelect(goalId);
    }
    setGoalPickerOpen(false);
  };
  return (
    <>
      {/* Form Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
            <Plus className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
          </div>
          <span className="text-lg font-semibold text-gray-900">Новий запис</span>
          {isPrefilled && isExpressFromMatches && (
            <Badge className="bg-blue-100 text-blue-600 border-0 rounded-full text-xs font-medium px-2.5 py-0.5 hover:bg-blue-100">
              Експрес з матчів
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={onClearForm}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-200"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          Очистити
        </button>
      </div>

      <div className="px-6 pb-6 space-y-8">
        {/* === Section: Basic Settings === */}
        <div className="space-y-4">
          <h3 className={classes.sectionTitle}>
            <Calendar className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
            Основні налаштування
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className={classes.label}>
                Дата матчу
              </Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={data.date}
                  onChange={(e) => onFieldChange('date', e.target.value)}
                  required
                  className={`${classes.input} [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer pr-10`}
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="game" className={classes.label}>
                Гра
              </Label>
              <Select
                value={data.game}
                onValueChange={(value: 'CS2' | 'Dota2') => onFieldChange('game', value)}
              >
                <SelectTrigger className={classes.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CS2">
                    <span className="flex items-center gap-2">
                      <img src="/assets/team-placeholder.svg" alt="CS2" className="h-4 w-4 object-contain" />
                      CS2
                    </span>
                  </SelectItem>
                  <SelectItem value="Dota2">
                    <span className="flex items-center gap-2">
                      <img src="/assets/team-placeholder-dota.svg" alt="Dota2" className="h-4 w-4 object-contain" />
                      Dota 2
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="betCategory" className={classes.label}>
                Категорія
              </Label>
              <Select key={data.betCategory} value={data.betCategory} onValueChange={onCategoryChange}>
                <SelectTrigger className={classes.selectTrigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ординар">Ординар</SelectItem>
                  <SelectItem value="Експрес">Експрес (до 10 подій)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data.betCategory === 'Ординар' && (
              <div className="space-y-1.5">
                <Label htmlFor="format" className={classes.label}>
                  Формат
                </Label>
                <Select
                  value={data.format}
                  onValueChange={(value) => onFieldChange('format', value)}
                >
                  <SelectTrigger className={classes.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BO1">BO1</SelectItem>
                    <SelectItem value="BO3">BO3</SelectItem>
                    <SelectItem value="BO5">BO5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeGoals.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="goalId" className={classes.label}>
                  Ціль
                </Label>
                <button
                  type="button"
                  onClick={() => setGoalPickerOpen(true)}
                  className={`flex items-center justify-between w-full rounded-xl border text-sm h-10 px-4 py-2 transition-all ${
                    selectedGoal
                      ? 'border-[#2563EB] bg-[#EFF6FF] text-[#111827]'
                      : 'border-[#E5E7EB] bg-white text-[#9CA3AF] hover:border-[#D1D5DB]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {selectedGoal ? (
                      <>
                        <Target className="h-4 w-4 text-[#2563EB] flex-shrink-0" strokeWidth={1.5} />
                        <span className="font-medium text-[#111827] truncate">{selectedGoal.name}</span>
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 text-[#9CA3AF] flex-shrink-0" strokeWidth={1.5} />
                        Без цілі
                      </>
                    )}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2 text-[#9CA3AF]" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Picker Modal */}
      <GoalPickerModal
        open={goalPickerOpen}
        onOpenChange={setGoalPickerOpen}
        goals={activeGoals}
        selectedGoalId={data.goalId}
        onSelect={handleGoalSelect}
      />
    </>
  );
}
