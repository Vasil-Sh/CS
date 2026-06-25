import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X } from 'lucide-react';
import { getStatusBadge } from '@/lib/displayHelpers';
import type { RiskyTeam } from './sidebar-types';

interface SidebarRiskyTeamsProps {
  riskyTeams: RiskyTeam[];
  onRemoveTeam: (index: number) => void;
}

export default function SidebarRiskyTeams({ riskyTeams, onRemoveTeam }: SidebarRiskyTeamsProps) {
  return (
    <div
      className="bg-white border border-gray-300 rounded-3xl flex flex-col"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
        </div>
        <span className="text-lg font-semibold text-gray-900">Ризиковані команди</span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        {riskyTeams.length > 0 ? (
          <div className="space-y-3">
            {riskyTeams.map((riskyTeam, index) => (
              <div
                key={index}
                className="p-4 border border-blue-500 rounded-2xl bg-white space-y-2.5 hover:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-semibold text-gray-900">
                        {riskyTeam.name}
                      </span>
                    </div>
                    <Badge className={getStatusBadge(riskyTeam.status)}>{riskyTeam.status}</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveTeam(index)}
                    className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
                {riskyTeam.notes && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white/60 p-3 rounded-xl">
                    {riskyTeam.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mx-auto mb-3">
              <AlertTriangle className="h-7 w-7 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Усі команди безпечні</p>
            <p className="text-xs text-gray-400">Ризиковані команди не знайдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
