import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Globe, DollarSign, Sun, Moon, RefreshCw } from 'lucide-react';
import type { Lang } from '@/lib/i18n';

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
  return (
    <Card className="border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-3xl bg-white overflow-hidden transition-all duration-300" style={{ boxShadow: chartCardShadow }}>
      <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
          <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
            <Palette className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
          </div>
          Налаштування інтерфейсу
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Theme Switcher */}
        <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            {theme === 'light' ? (
              <Sun className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.5} />
            ) : (
              <Moon className="h-5 w-5 text-[#6366F1]" strokeWidth={1.5} />
            )}
            <div>
              <p className="text-sm font-medium text-[#111827]">Тема оформлення</p>
              <p className="text-xs text-[#9CA3AF]">Оберіть зовнішній вигляд додатку</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#E5E7EB]">
            <Button variant="ghost" size="sm" onClick={() => onThemeChange('light')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${theme === 'light' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827] !bg-transparent hover:!bg-transparent'}`}>
              <Sun className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />Світла
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onThemeChange('dark')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${theme === 'dark' ? 'bg-[#111827] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827] !bg-transparent hover:!bg-transparent'}`}>
              <Moon className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />Темна
            </Button>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-[#111827]">Мова інтерфейсу</p>
              <p className="text-xs text-[#9CA3AF]">Оберіть мову відображення</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#E5E7EB]">
            <Button variant="ghost" size="sm" onClick={() => onLanguageChange('uk')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${language === 'uk' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827] !bg-transparent hover:!bg-transparent'}`}>UA</Button>
            <Button variant="ghost" size="sm" onClick={() => onLanguageChange('en')} className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${language === 'en' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827] !bg-transparent hover:!bg-transparent'}`}>ENG</Button>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-5 w-5 text-[#22C55E]" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-[#111827]">Курс USD → UAH</p>
              <p className="text-xs text-[#9CA3AF]">{exchangeRate > 0 ? `Поточний: ${exchangeRate} ₴` : 'Не встановлено'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="number" step="0.01" value={exchangeRate} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) onExchangeRateChange(v); }} className="flex-1 h-10 px-3 rounded-xl border border-[#D1D5DB] hover:border-[#9CA3AF] focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-colors text-sm bg-white text-[#111827] outline-none" />
            <Button onClick={onFetchRate} disabled={isFetchingRate} size="sm" className="rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-10 px-4 text-sm">
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetchingRate ? "animate-spin" : ""}`} strokeWidth={2} />Оновити
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
