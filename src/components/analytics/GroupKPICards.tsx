import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';

interface Props {
  groupsCount: number; totalBets: number; winRate: number; totalProfit: number;
}

export default function GroupKPICards({ groupsCount, totalBets, winRate, totalProfit }: Props) {
  const cards = [
    { icon: Users, label: 'Групи', value: groupsCount, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: BarChart3, label: 'Ставок', value: totalBets, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]' },
    { icon: TrendingUp, label: 'Вінрейт', value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? 'text-green-500' : 'text-amber-500', bg: winRate >= 50 ? 'bg-green-50' : 'bg-amber-50' },
    { icon: DollarSign, label: 'Прибуток', value: `${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(0)} ₴`, color: totalProfit >= 0 ? 'text-green-500' : 'text-red-500', bg: totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {cards.map(({ icon: Icon, label, value, color, bg }) => (
        <Card key={label} className="border border-gray-200 rounded-3xl bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <CardContent className="p-5">
            <div className={`p-2 rounded-xl ${bg} w-fit mb-2`}><Icon className={`h-4 w-4 ${color}`} strokeWidth={1.5} /></div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
