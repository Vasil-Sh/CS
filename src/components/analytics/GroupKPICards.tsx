import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';

interface Props {
  groupsCount: number; totalBets: number; winRate: number; totalProfit: number;
}

export default function GroupKPICards({ groupsCount, totalBets, winRate, totalProfit }: Props) {
  const cards = [
    { icon: Users, label: 'Групи', value: groupsCount, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
    { icon: BarChart3, label: 'Ставок', value: totalBets, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]' },
    { icon: TrendingUp, label: 'Вінрейт', value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? 'text-[#22C55E]' : 'text-[#F59E0B]', bg: winRate >= 50 ? 'bg-[#F0FDF4]' : 'bg-[#FFFBEB]' },
    { icon: DollarSign, label: 'Прибуток', value: `${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(0)} ₴`, color: totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]', bg: totalProfit >= 0 ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {cards.map(({ icon: Icon, label, value, color, bg }) => (
        <Card key={label} className="border border-[#E5E7EB] rounded-3xl bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <CardContent className="p-5">
            <div className={`p-2 rounded-xl ${bg} w-fit mb-2`}><Icon className={`h-4 w-4 ${color}`} strokeWidth={1.5} /></div>
            <p className="text-xs text-[#6B7280] font-medium">{label}</p>
            <p className="text-xl font-bold text-[#111827] mt-0.5">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
