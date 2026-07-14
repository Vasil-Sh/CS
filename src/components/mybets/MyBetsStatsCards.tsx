import { useMemo, type ReactNode } from "react";
import {
  Wallet, DollarSign, BarChart3, Target, Clock, Trophy,
  AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, Pencil,
} from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import StatCard from "@/components/StatCard";
import type { Bet } from "@/types/betting";
import type { DualBankrollStats } from "@/lib/bankrollService";

interface MyBetsStatsCardsProps {
  recentBets: Bet[];
  stats: { totalBets: number; winRate: number; averageROI: number };
  dualBank: DualBankrollStats;
  currencyMode: "UAH" | "USD";
  activeBets: Bet[];
  winningBets: Bet[];
  losingBets: Bet[];
  onEditBank?: () => void;
}

export default function MyBetsStatsCards({
  recentBets, stats, dualBank, currencyMode, activeBets, winningBets, losingBets, onEditBank,
}: MyBetsStatsCardsProps) {
  const profitByCurrency = useMemo(() => {
    const completed = recentBets.filter(b => b.result === "Win" || b.result === "Loss");
    let profitUAH = 0, profitUSD = 0;
    for (const b of completed) {
      const profit = b.profit || 0;
      if (b.currency === "USD" && b.exchangeRate) {
        profitUSD += profit / Number(b.exchangeRate);
      } else {
        profitUAH += profit;
      }
    }
    return { profitUAH, profitUSD };
  }, [recentBets]);

  const profit = currencyMode === "USD" ? profitByCurrency.profitUSD : profitByCurrency.profitUAH;
  const bank = currencyMode === "USD" ? dualBank.usd : dualBank.uah;
  const isUp = profit >= 0;
  const bankUp = bank.totalProfit >= 0;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Bank card with edit button */}
        <div
          className="relative bg-white border border-gray-200 rounded-3xl px-6 py-5 transition-all duration-300 ease-out cursor-pointer overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-gray-400 hover:-translate-y-[3px]"
          onClick={onEditBank}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
              <Wallet className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {currencyMode === "USD" ? "Поточний банк (USDT)" : "Поточний банк"}
            </span>
            {onEditBank && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditBank(); }}
                className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-[0_2px_8px_rgba(68,122,252,0.3)] transition-all duration-200"
                title="Редагувати банк"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
          <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2 flex items-baseline gap-1">
            {currencyMode === "USD" ? "$" : ""}
            <NumberTicker value={Math.round(bank.currentBank)} />
            {currencyMode !== "USD" && " ₴"}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {bankUp ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" strokeWidth={2.5} />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" strokeWidth={2.5} />
            )}
            <span className={bankUp ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
              {currencyMode === "USD"
                ? `${Number(bank.totalProfit) >= 0 ? "+" : ""}$${Number(bank.totalProfit).toFixed(2)}`
                : `${Number(bank.totalProfit) >= 0 ? "+" : ""}${Number(bank.totalProfit).toFixed(2)} ₴`}
            </span>
            <span className="text-gray-400">за весь час</span>
          </div>
        </div>

        <StatCard
          icon={<IconBox><DollarSign className="h-5 w-5 text-primary" strokeWidth={1.5} /></IconBox>}
          label="Профіт"
          value={<>{isUp ? "+" : ""}{currencyMode === "USD" ? "$" : ""}<NumberTicker value={Math.abs(Math.round(profit * 100) / 100)} decimalPlaces={2} />{currencyMode !== "USD" && " ₴"}</>}
          valueColor={isUp ? (currencyMode === "USD" ? "text-green-500" : "text-gray-900") : "text-red-500"}
          subtext={isUp ? "Позитивна динаміка" : "Негативна динаміка"}
          subIcon={isUp ? <ArrowUpRight className="h-4 w-4 text-green-500" strokeWidth={2.5} /> : <ArrowDownRight className="h-4 w-4 text-red-500" strokeWidth={2.5} />}
          trend={isUp ? "up" : "down"}
        />
        <StatCard
          icon={<IconBox><BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.5} /></IconBox>}
          label="Всього записів"
          value={<NumberTicker value={stats.totalBets} />}
          subtext={activeBets.length > 0 ? `${activeBets.length} активних` : "Немає активних"}
        />
        {/* Winrate card — large donut filling the card */}
        <div
          className="relative bg-white border border-gray-100 rounded-3xl px-5 py-4 transition-all duration-300 ease-out cursor-default overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-gray-300"
          style={{ transform: "translateY(0)" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
              <Target className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <span className="text-lg font-semibold text-gray-900">Вінрейт</span>
          </div>
          <div className="flex items-center justify-center">
            <AnimatedCircularProgressBar
              max={100}
              min={0}
              value={stats.winRate}
              gaugePrimaryColor="#22C55E"
              gaugeSecondaryColor="#E5E7EB"
              className="!w-28 !h-28"
            />
          </div>
          <div className="text-center mt-1">
            <span className="text-xs text-gray-400">{winningBets.length}W / {losingBets.length}L</span>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <StatCard
          icon={<IconBox><Clock className="h-5 w-5 text-primary" strokeWidth={1.5} /></IconBox>}
          label="Активні" value={<NumberTicker value={activeBets.length} />} valueColor="text-blue-500"
          subtext="Очікують результату"
        />
        <StatCard
          icon={<IconBox><Trophy className="h-5 w-5 text-primary" strokeWidth={1.5} /></IconBox>}
          label="Виграші" value={<NumberTicker value={winningBets.length} />} valueColor="text-green-500"
          subtext="Успішних записів" trend="up"
        />
        <StatCard
          icon={<IconBox><AlertTriangle className="h-5 w-5 text-primary" strokeWidth={1.5} /></IconBox>}
          label="Програші" value={<NumberTicker value={losingBets.length} />} valueColor="text-red-500"
          subtext="Невдалих записів" trend="down"
        />
        <StatCard
          icon={<IconBox><TrendingUp className="h-5 w-5 text-primary" strokeWidth={1.5} /></IconBox>}
          label="Середній ROI"
          value={<>{stats.averageROI >= 0 ? "+" : ""}<NumberTicker value={Math.abs(stats.averageROI)} />%</>}
          valueColor={stats.averageROI >= 0 ? "text-gray-900" : "text-red-500"}
          subtext={stats.averageROI >= 0 ? "Позитивний" : "Негативний"}
          subIcon={stats.averageROI >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" strokeWidth={2.5} /> : <ArrowDownRight className="h-4 w-4 text-red-500" strokeWidth={2.5} />}
          trend={stats.averageROI >= 0 ? "up" : "down"}
        />
      </div>
    </div>
  );
}

function IconBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
      {children}
    </div>
  );
}
