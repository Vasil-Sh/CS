import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Users2, Target, Hash, DollarSign, CheckCircle2, ArrowRight } from "lucide-react";

const STORAGE_KEY = "matchiq_onboarding_completed";

interface Step {
  icon: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: "Users2",
    title: "Введіть команди",
    description: "Почніть із введення назв команд у формі «Новий запис». Також можна вставити HLTV-посилання для автозаповнення матчу.",
  },
  {
    icon: "Target",
    title: "Оберіть тип прогнозу",
    description: "Натисніть «Оберіть тип прогнозу», щоб відкрити модальне вікно з варіантами: переможець матчу, тотал карт, фора або детальні опції по картах.",
  },
  {
    icon: "Hash",
    title: "Коефіцієнт і вибір",
    description: "Вкажіть коефіцієнт із букмекерської лінії та оберіть команду, на яку ставите. Це обовʼязкові поля для створення ставки.",
  },
  {
    icon: "DollarSign",
    title: "Сума та впевненість",
    description: "Введіть суму ставки. За бажанням — вкажіть вашу впевненість у % для розрахунку Value Bet та рекомендацій за критерієм Келлі.",
  },
  {
    icon: "CheckCircle2",
    title: "Аналітика та трекінг",
    description: "Усі ставки потрапляють на вкладку «Останні записи» та в «Аналітику», де ви бачите ROI, Win Rate, прибуток за місяцями та за стратегіями.",
  },
];

const iconMap: Record<string, React.ReactNode> = {
  Users2: <Users2 className="h-10 w-10 text-blue-500" strokeWidth={1.5} />,
  Target: <Target className="h-10 w-10 text-green-500" strokeWidth={1.5} />,
  Hash: <Hash className="h-10 w-10 text-amber-500" strokeWidth={1.5} />,
  DollarSign: <DollarSign className="h-10 w-10 text-red-500" strokeWidth={1.5} />,
  CheckCircle2: <CheckCircle2 className="h-10 w-10 text-[#447afc]" strokeWidth={1.5} />,
};

const ICON_COLORS: Record<string, string> = {
  Users2: 'bg-blue-50',
  Target: 'bg-green-50',
  Hash: 'bg-amber-50',
  DollarSign: 'bg-red-50',
  CheckCircle2: 'bg-blue-50',
};

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  return { showOnboarding, setShowOnboarding };
}

/** Reset the onboarding so it shows again on the next page load */
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function OnboardingTour({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const current = STEPS[step];

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) finish(); }}>
      <DialogContent className="rounded-3xl max-w-lg border border-[#E5E7EB] p-0 gap-0" hideCloseButton>
        {/* Progress */}
        <div className="flex gap-1 px-6 pt-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-[#447afc]' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-2 text-center space-y-4">
          <div className={`flex items-center justify-center w-20 h-20 rounded-3xl mx-auto ${ICON_COLORS[current.icon] || 'bg-[#F3F4F6]'}`}>
            {iconMap[current.icon]}
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-[#111827] mb-2">{current.title}</DialogTitle>
            <DialogDescription className="text-base text-gray-500 leading-relaxed">{current.description}</DialogDescription>
          </div>
        </div>

        {/* Nav */}
        <DialogFooter className="px-6 pb-6 pt-4 flex items-center justify-between">
          <button onClick={finish} className="text-sm text-gray-400 hover:text-gray-600 font-medium">Пропустити</button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Назад</button>
            )}
            <Button onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()}
              className="rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white font-semibold text-sm px-5 h-10">
              {step < STEPS.length - 1 ? <><ArrowRight className="h-4 w-4 mr-1.5" strokeWidth={2} />Далі</> : <><Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />Почати</>}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
