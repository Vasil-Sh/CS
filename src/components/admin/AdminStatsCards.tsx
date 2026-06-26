import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Target, Shield } from 'lucide-react';

interface Props {
  totalUsers: number; activeUsers: number; adminUsers: number; inactiveUsers: number;
}

export default function AdminStatsCards({ totalUsers, activeUsers, adminUsers, inactiveUsers }: Props) {
  const cards = [
    { icon: Trophy, label: 'Всього', value: totalUsers, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
    { icon: TrendingUp, label: 'Активні', value: activeUsers, color: 'text-[#22C55E]', bg: 'bg-[#F0FDF4]' },
    { icon: Shield, label: 'Адміни', value: adminUsers, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]' },
    { icon: Target, label: 'Неактивні', value: inactiveUsers, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {cards.map(({ icon: Icon, label, value, color, bg }) => (
        <Card key={label} className="border border-[#E5E7EB] rounded-3xl bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-2xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} strokeWidth={1.5} /></div>
            </div>
            <p className="text-sm text-[#6B7280] font-medium">{label}</p>
            <p className="text-3xl font-bold text-[#111827] mt-1">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
