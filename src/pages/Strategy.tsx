import { useState, useEffect } from 'react';
import { Target, Flag, AlertTriangle, User } from 'lucide-react';
import StrategyOverview from '@/components/StrategyOverview';
import GoalsManager from '@/components/GoalsManager';
import RiskManagement from '@/components/RiskManagement';
import StrategyOverviewHeader from '@/components/StrategyOverviewHeader';
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
        {/* Overview header: KPI cards + current strategy + insight */}
        <StrategyOverviewHeader key={`soh-${strategyVersion}`} bets={bets} onNavigateTab={setActiveTab} refreshKey={strategyVersion} currentUser={currentUser} />

        {/* Tabs bar — matches styling used elsewhere in the app */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
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
              <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <StrategyOverview />
              </div>
            )}
            {activeTab === 'goals' && (
              <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <GoalsManager />
              </div>
            )}
            {activeTab === 'risks' && <RiskManagement bets={bets} />}
          </div>
        </div>
      </div>
    </div>
  );
}