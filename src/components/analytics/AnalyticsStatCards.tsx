import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, TrendingUp, DollarSign } from 'lucide-react';

interface Props {
  stats: { totalBets: number; winRate: number; totalProfit: number; roi: number };
  onBankCardClick?: () => void;
}

export default function AnalyticsStatCards({ stats, onBankCardClick }: Props) {
  const cards = [
    { icon: DollarSign, label: 'Поточний банк', value: `${stats.totalProfit.toFixed(0)} ₴`, color: 'text-[#22C55E]', bg: 'bg-[#F0FDF4]', onClick: onBankCardClick },
    { icon: TrendingUp, label: 'Загальний прибуток', value: `${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(0)} ₴`, color: stats.totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]', bg: stats.totalProfit >= 0 ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]' },
    { icon: Target, label: 'Всього ставок', value: String(stats.totalBets), color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
    { icon: Trophy, label: 'Вінрейт', value: `${stats.winRate.toFixed(1)}%`, color: stats.winRate >= 50 ? 'text-[#22C55E]' : 'text-[#F59E0B]', bg: stats.winRate >= 50 ? 'bg-[#F0FDF4]' : 'bg-[#FFFBEB]' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map(({ icon: Icon, label, value, color, bg, onClick }) => (
        <Card key={label} className={`border border-[#E5E7EB] rounded-3xl bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
          <CardContent className="p-6">
            <div className={`p-2.5 rounded-2xl ${bg} w-fit mb-3`}><Icon className={`h-5 w-5 ${color}`} strokeWidth={1.5} /></div>
            <p className="text-sm text-[#6B7280] font-medium">{label}</p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
