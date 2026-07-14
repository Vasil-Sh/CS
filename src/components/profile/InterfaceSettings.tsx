import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Globe, DollarSign, Sun, Moon, RefreshCw, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { resetOnboarding } from '@/components/OnboardingTour';
import type { Lang } from '@/lib/i18n';
import { useState } from 'react';

interface Props {
  theme: 'light' | 'dark';
  language: Lang;
  exchangeRate: number;
  isFetchingRate: boolean;
  onThemeChange: (t: 'light' | 'dark') => void;
  onLanguageChange: (l: Lang) => void;
  onExchangeRateChange: (v: number) => void;
  onFetchRate: () => void;
  chartCardShadow: string;
}

export default function InterfaceSettings({
  theme, language, exchangeRate, isFetchingRate,
  onThemeChange, onLanguageChange, onExchangeRateChange, onFetchRate, chartCardShadow,
}: Props) {
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);

  const handleResetOnboarding = () => {
    setIsResettingOnboarding(true);
    resetOnboarding();
    setTimeout(() => {
      setIsResettingOnboarding(false);
      toast.success('Онбординг скинуто — покажеться при наступному вході');
    }, 300);
  };
  return (
    <Card className="border border-gray-200 hover:border-gray-300 rounded-3xl bg-white overflow-hidden transition-all duration-300" style={{ boxShadow: chartCardShadow }}>
      <CardHeader className="bg-white border-b border-gray-200 p-6">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
          <div className="p-2.5 bg-gray-100 rounded-xl">
            <Palette className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
          </div>
          Налаштування інтерфейсу
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Theme Switcher */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3">
            {theme === 'light' ? (
              <Sun className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
            ) : (
              <Moon className="h-5 w-5 text-[#6366F1]" strokeWidth={1.5} />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">Тема оформлення</p>
              <p className="text-xs text-gray-400">Оберіть зовнішній вигляд додатку</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-gray-200">
            <Button variant="ghost" size="sm" onClick={() => onThemeChange('light')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 !bg-transparent hover:!bg-transparent'}`}>
              <Sun className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />Світла
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onThemeChange('dark')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${theme === 'dark' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 !bg-transparent hover:!bg-transparent'}`}>
              <Moon className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />Темна
            </Button>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-gray-900">Мова інтерфейсу</p>
              <p className="text-xs text-gray-400">Оберіть мову відображення</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-gray-200">
            <Button variant="ghost" size="sm" onClick={() => onLanguageChange('uk')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${language === 'uk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 !bg-transparent hover:!bg-transparent'}`}>UA</Button>
            <Button variant="ghost" size="sm" onClick={() => onLanguageChange('en')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 !bg-transparent hover:!bg-transparent'}`}>ENG</Button>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-5 w-5 text-green-500" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-gray-900">Курс USD → UAH</p>
              <p className="text-xs text-gray-400">{exchangeRate > 0 ? `Поточний: ${exchangeRate} ₴` : 'Не встановлено'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="number" step="0.01" value={exchangeRate} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) onExchangeRateChange(v); }} className="flex-1 h-10 px-3 rounded-xl border border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors text-sm bg-white text-gray-900 outline-none" />
            <Button onClick={onFetchRate} disabled={isFetchingRate} size="sm" className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium h-10 px-4 text-sm">
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetchingRate ? "animate-spin" : ""}`} strokeWidth={2} />Оновити
            </Button>
          </div>
        </div>

        {/* Onboarding Reset */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-gray-900">Онбординг-тур</p>
              <p className="text-xs text-gray-400">Показати ознайомчий тур для нових користувачів</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isResettingOnboarding}
            onClick={handleResetOnboarding}
            className="rounded-xl border-gray-300 text-gray-900 font-medium text-sm h-9 px-4 hover:bg-gray-100"
          >
            {isResettingOnboarding ? 'Скидання...' : 'Скинути'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
