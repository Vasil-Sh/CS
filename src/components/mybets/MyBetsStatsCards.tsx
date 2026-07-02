import { useMemo, type ReactNode } from "react";
import {
  Wallet, DollarSign, BarChart3, Target, Clock, Trophy,
  AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
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
}

export default function MyBetsStatsCards({
  recentBets, stats, dualBank, currencyMode, activeBets, winningBets, losingBets,
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
    <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<IconBox><Wallet className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></IconBox>}
          label={currencyMode === "USD" ? "Поточний банк (USDT)" : "Поточний банк"}
          value={currencyMode === "USD"
            ? `$${bank.currentBank.toLocaleString("uk-UA", { maximumFractionDigits: 0 })}`
            : `${bank.currentBank.toLocaleString("uk-UA", { maximumFractionDigits: 0 })} ₴`}
          valueColor={currencyMode === "USD" ? "text-[#D97706]" : undefined}
          subtext={currencyMode === "USD"
            ? `${Number(bank.totalProfit) >= 0 ? "+" : ""}$${Number(bank.totalProfit).toFixed(2)} за весь час`
            : `${Number(bank.totalProfit) >= 0 ? "+" : ""}${Number(bank.totalProfit).toFixed(2)} ₴ за весь час`}
          subIcon={bankUp ? <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} /> : <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />}
          trend={bankUp ? "up" : "down"}
        />
        <StatCard
          icon={<IconBox><DollarSign className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></IconBox>}
          label="Профіт"
          value={currencyMode === "USD"
            ? `${isUp ? "+" : ""}$${profit.toFixed(2)}`
            : `${isUp ? "+" : ""}${profit.toFixed(2)} ₴`}
          valueColor={isUp ? (currencyMode === "USD" ? "text-[#22C55E]" : "text-[#111827]") : "text-[#EF4444]"}
          subtext={isUp ? "Позитивна динаміка" : "Негативна динаміка"}
          subIcon={isUp ? <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} /> : <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />}
          trend={isUp ? "up" : "down"}
        />
        <StatCard
          icon={<IconBox><BarChart3 className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></IconBox>}
          label="Всього записів"
          value={String(stats.totalBets)}
          subtext={activeBets.length > 0 ? `${activeBets.length} активних` : "Немає активних"}
        />
        <StatCard
          icon={<IconBox><Target className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></IconBox>}
          label="Вінрейт"
          value={`${stats.winRate}%`}
          subtext={`${winningBets.length}W / ${losingBets.length}L`}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <StatCard
          icon={<IconBox><Clock className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></IconBox>}
          label="Активні" value={String(activeBets.length)} valueColor="text-[#3B82F6]"
          subtext="Очікують результату"
        />
        <StatCard
          icon={<IconBox><Trophy className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></IconBox>}
          label="Виграші" value={String(winningBets.length)} valueColor="text-[#22C55E]"
          subtext="Успішних записів" trend="up"
        />
        <StatCard
          icon={<IconBox><AlertTriangle className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></IconBox>}
          label="Програші" value={String(losingBets.length)} valueColor="text-[#EF4444]"
          subtext="Невдалих записів" trend="down"
        />
        <StatCard
          icon={<IconBox><TrendingUp className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></IconBox>}
          label="Середній ROI"
          value={`${stats.averageROI >= 0 ? "+" : ""}${stats.averageROI}%`}
          valueColor={stats.averageROI >= 0 ? "text-[#111827]" : "text-[#EF4444]"}
          subtext={stats.averageROI >= 0 ? "Позитивний" : "Негативний"}
          subIcon={stats.averageROI >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} /> : <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />}
          trend={stats.averageROI >= 0 ? "up" : "down"}
        />
      </div>
    </div>
  );
}

function IconBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
      {children}
    </div>
  );
}
