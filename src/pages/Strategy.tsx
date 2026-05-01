import { useState, useEffect } from 'react';
import { Target, Flag, AlertTriangle } from 'lucide-react';
import StrategyOverview from '@/components/StrategyOverview';
import GoalsManager from '@/components/GoalsManager';
import RiskManagement from '@/components/RiskManagement';
import { UserDataService } from '@/lib/userDataService';
import type { Bet } from '@/types/betting';

/**
 * Strategy page — unified screen that hosts strategies, goals and risks.
 *
 * This page extracts the "Стратегії" tab previously living inside MyBets and
 * the "Цілі" / "Ризики" tabs previously living inside Analytics, so users
 * can access all strategy-related views from a single navigation entry.
 */
export default function Strategy() {
  const [activeTab, setActiveTab] = useState<'strategies' | 'goals' | 'risks'>('strategies');
  const [bets, setBets] = useState<Bet[]>([]);

  const currentUser = localStorage.getItem('username') || 'default';

  useEffect(() => {
    // RiskManagement needs the user's bets. We reuse the same storage layer
    // that Analytics / MyBets rely on to stay consistent.
    const myBetsData = UserDataService.getUserData<Bet[]>(currentUser, 'mybets_data', []);
    setBets(myBetsData || []);
  }, [currentUser]);

  const tabs = [
    { id: 'strategies' as const, label: 'Стратегії', icon: Target },
    { id: 'goals' as const, label: 'Цілі', icon: Flag },
    { id: 'risks' as const, label: 'Ризики', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1a1a2e] tracking-tight">
            Стратегія
          </h1>
          <p className="mt-2 text-[#6B7280] text-base">
            Стратегії, цілі та управління ризиками в одному місці
          </p>
        </div>

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
                        ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
                        : 'bg-transparent text-[#9CA3AF] hover:bg-[#F5F5F3] hover:text-[#6B7280]'
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
            {activeTab === 'strategies' && <StrategyOverview />}
            {activeTab === 'goals' && <GoalsManager />}
            {activeTab === 'risks' && <RiskManagement bets={bets} />}
          </div>
        </div>
      </div>
    </div>
  );
}