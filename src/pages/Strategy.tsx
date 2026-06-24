import { useState, useEffect } from 'react';
import { Target, Flag, AlertTriangle, ShieldAlert, TrendingUp, Activity } from 'lucide-react';
import StrategyOverview from '@/components/StrategyOverview';
import GoalsManager from '@/components/GoalsManager';
import RiskManagement from '@/components/RiskManagement';
import { UserDataService } from '@/lib/userDataService';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/appStore';import { logRender } from '@/lib/devLogger';import { PageHeader } from '@/components/PageHeader';
import type { Bet } from '@/types/betting';

export default function Strategy() {
  logRender('Strategy');
  const [activeTab, setActiveTab] = useState<'strategies' | 'goals' | 'risks'>('strategies');
  const [bets, setBets] = useState<Bet[]>([]);

  const { user } = useAuth();
  const currentUser = user?.username || 'default';
  const strategyVersion = useAppStore((s) => s.strategyVersion);

  useEffect(() => {
    const myBetsData = UserDataService.getUserData<Bet[]>(currentUser, 'mybets_data', []);
    setBets(myBetsData || []);
  }, [currentUser, strategyVersion]);

  const tabs = [
    { id: 'strategies' as const, label: 'Стратегії', icon: Target },
    { id: 'goals' as const, label: 'Цілі', icon: Flag },
    { id: 'risks' as const, label: 'Ризиковані команди', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      {/* ===== HEADER ===== */}
      <PageHeader
        title="Стратегії та Цілі"
        currentUser={currentUser || 'User'}
        isDarkTheme={false}
        onToggleTheme={() => {}}
        showThemeToggle={false}
      />

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">
        {/* ===== KPI CARDS ===== */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Активна стратегія */}
            <div className="bg-white rounded-3xl px-6 py-3 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <Target className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                </div>
                <span className="text-xl font-semibold text-[#111827]">Активна стратегія</span>
              </div>
              <div className="text-3xl font-bold text-[#9CA3AF] mb-1">Не обрано</div>
              <span className="text-sm text-[#9CA3AF]">Оберіть основну стратегію</span>
            </div>
            {/* Головна ціль */}
            <div className="bg-white rounded-3xl px-6 py-3 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <Flag className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                </div>
                <span className="text-xl font-semibold text-[#111827]">Головна ціль</span>
              </div>
              <div className="text-3xl font-bold text-[#9CA3AF] mb-1">Не обрано</div>
              <span className="text-sm text-[#9CA3AF]">Оберіть головну ціль</span>
            </div>
            {/* Рівень ризику */}
            <div className="bg-white rounded-3xl px-6 py-3 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                </div>
                <span className="text-xl font-semibold text-[#111827]">Рівень ризику</span>
              </div>
              <div className="py-1">
                <div className="text-3xl font-bold text-[#9CA3AF] mb-1">—</div>
                <div className="flex items-center gap-1 mb-1 opacity-30">
                  <div className="flex-1 h-2 rounded-full bg-[#DCFCE7]" />
                  <div className="flex-1 h-2 rounded-full bg-[#FEF3C7]" />
                  <div className="flex-1 h-2 rounded-full bg-[#FEE2E2]" />
                </div>
                <span className="text-sm text-[#9CA3AF]">Мін. 3 ставки за тиждень</span>
              </div>
            </div>
            {/* Вінрейт 30 днів */}
            <div className="bg-white rounded-3xl px-6 py-3 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                </div>
                <span className="text-xl font-semibold text-[#111827]">Вінрейт 30 днів</span>
              </div>
              <div className="py-1">
                <div className="text-3xl font-bold text-[#9CA3AF] mb-1">—</div>
                <span className="text-sm text-[#9CA3AF]">Немає завершених ставок</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== CURRENT STRATEGY + CURRENT GOAL ===== */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Поточна стратегія */}
            <div className="bg-white rounded-[32px] border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] h-full flex flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-[#447afc]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-[#374151] tracking-tight">Поточна стратегія</h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">Правила, яких ви дотримуєтесь</p>
                  </div>
                </div>
              </div>
              <div className="h-px w-full bg-[#F3F4F6]" />
              <div className="flex-1 flex flex-col items-center justify-center px-7 py-12 text-center">
                <div className="p-6 bg-[#F3F4F6] rounded-3xl inline-block mb-4">
                  <Activity className="h-12 w-12 text-[#9CA3AF]" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">Ви ще не обрали основну стратегію</h3>
                <p className="text-sm text-[#6B7280] max-w-sm leading-relaxed">Перейдіть у вкладку «Стратегії» та натисніть ☆, щоб встановити стратегію як основну</p>
              </div>
            </div>
            {/* Поточна ціль */}
            <div className="bg-white rounded-[32px] border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] h-full flex flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                    <Flag className="h-5 w-5 text-[#447afc]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-[#374151] tracking-tight">Поточна ціль</h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">Ціль, над якою ви працюєте</p>
                  </div>
                </div>
              </div>
              <div className="h-px w-full bg-[#F3F4F6]" />
              <div className="flex-1 flex flex-col items-center justify-center px-7 py-12 text-center">
                <div className="p-6 bg-[#F3F4F6] rounded-3xl inline-block mb-4">
                  <Flag className="h-12 w-12 text-[#9CA3AF]" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">У вас ще немає активної цілі</h3>
                <p className="text-sm text-[#6B7280] max-w-sm leading-relaxed">Перейдіть у вкладку «Цілі» та створіть нову ціль для відстеження прогресу</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs bar */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-3 gap-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative rounded-[24px] px-6 py-4 font-light text-base
                      transition-all duration-300 ease-in-out
                      ${isActive
                        ? 'bg-[#447afc] text-white font-medium shadow-[0_4px_16px_rgba(68,122,252,0.3)] border border-transparent'
                        : 'bg-transparent text-[#9CA3AF] hover:bg-[#F5F5F3] hover:text-[#6B7280] border border-transparent'
                      }
                    `}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'strategies' && (
              <StrategyOverview />
            )}
            {activeTab === 'goals' && (
              <GoalsManager />
            )}
            {activeTab === 'risks' && <RiskManagement bets={bets} />}
          </div>
        </div>
      </div>
    </div>
  );
}