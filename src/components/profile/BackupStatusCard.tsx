import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface Props {
  lastBackupDate: Date | null;
  needsBackupReminder: boolean;
  chartCardShadow: string;
}

export default function BackupStatusCard({ lastBackupDate, needsBackupReminder, chartCardShadow }: Props) {
  return (
    <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: chartCardShadow }}>
      <div className="py-5 px-6 flex items-center gap-4">
        <div className="p-3 bg-[#FEF2F2] rounded-xl flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-[#EF4444]" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-semibold text-[#111827]">Останній бекап</p>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {lastBackupDate
              ? lastBackupDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Бекап ще не робився'}
          </p>
        </div>
        {needsBackupReminder && (
          <Badge className="ml-auto bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded-lg font-semibold text-xs px-3 py-1 flex-shrink-0 animate-pulse">
            <AlertTriangle className="h-3 w-3 mr-1" strokeWidth={2} />
            Зробіть бекап
          </Badge>
        )}
      </div>
    </div>
  );
}
