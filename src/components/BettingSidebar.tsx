import SidebarCalculations from './betting-form/SidebarCalculations';
import SidebarRiskyTeams from './betting-form/SidebarRiskyTeams';
import type { RiskyTeam, EVVerdict, ValueBetAnalysis, KellyData } from './betting-form/sidebar-types';

export type { RiskyTeam, EVVerdict, ValueBetAnalysis, KellyData };

export interface BettingSidebarProps {
  stake: string;
  odds: string;
  confidence: string;
  betCategory: string;
  currency: string;
  totalExpressOdds: number;
  expressEventsCount: number;
  potentialProfit: string;
  potentialProfitInCurrency: string;
  expectedValue: string;
  evVerdict: EVVerdict;
  isValuePositive: boolean;
  valueBetAnalysis: ValueBetAnalysis | null;
  kellyData: KellyData | null;
  overconfidenceWarning: string | null;
  hasConfidence: boolean;
  isHighConfidence: boolean;
  riskyTeams: RiskyTeam[];
  maxStakePercent: number;
  onMaxStakePercentChange: (pct: number) => void;
  onApplyKellyAmount: (amount: number) => void;
  onRemoveRiskyTeam: (index: number) => void;
}

export function BettingSidebar(props: BettingSidebarProps) {
  const {
    stake, betCategory, currency, totalExpressOdds, expressEventsCount,
    potentialProfitInCurrency, expectedValue, evVerdict, isValuePositive,
    valueBetAnalysis, kellyData, overconfidenceWarning, hasConfidence,
    riskyTeams, maxStakePercent, onMaxStakePercentChange,
    onApplyKellyAmount, onRemoveRiskyTeam,
  } = props;

  return (
    <div className="xl:col-span-2 relative h-full flex flex-col">
      <div className="flex flex-col xl:grid xl:grid-cols-2 xl:gap-6 flex-1 min-h-0">
        <SidebarCalculations
          stake={stake}
          betCategory={betCategory}
          currency={currency}
          totalExpressOdds={totalExpressOdds}
          expressEventsCount={expressEventsCount}
          potentialProfitInCurrency={potentialProfitInCurrency}
          expectedValue={expectedValue}
          evVerdict={evVerdict}
          isValuePositive={isValuePositive}
          valueBetAnalysis={valueBetAnalysis}
          kellyData={kellyData}
          overconfidenceWarning={overconfidenceWarning}
          hasConfidence={hasConfidence}
          maxStakePercent={maxStakePercent}
          onMaxStakePercentChange={onMaxStakePercentChange}
          onApplyKellyAmount={onApplyKellyAmount}
        />
        <SidebarRiskyTeams
          riskyTeams={riskyTeams}
          onRemoveTeam={onRemoveRiskyTeam}
        />
      </div>
    </div>
  );
}
