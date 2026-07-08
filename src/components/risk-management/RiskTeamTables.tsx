import { type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Target,
  Shield,
  Pencil,
  Plus,
  RotateCcw,
  Info,
  Users,
} from "lucide-react";
import type { RiskyTeam } from "@/data/riskyTeams";

const ALL_STATUSES = [
  "БАН",
  "Нестабільні",
  "Обережно",
  "Рідко",
  "Надійна",
  "Без статусу",
] as const;

interface RiskTeamTablesProps {
  allTeams: RiskyTeam[];
  csTeams: RiskyTeam[];
  dotaTeams: RiskyTeam[];
  uncategorizedTeams: RiskyTeam[];
  csStatusFilter: string;
  dotaStatusFilter: string;
  csStatusCounts: Record<string, number>;
  dotaStatusCounts: Record<string, number>;
  chartCardShadow: string;
  onCsStatusFilterChange: (f: string) => void;
  onDotaStatusFilterChange: (f: string) => void;
  onAddNew: () => void;
  getStatusFilterBadge: (status: string, active: boolean) => string;
  renderTeamCard: (team: RiskyTeam, globalIndex: number) => ReactNode;
}

export default function RiskTeamTables({
  allTeams,
  csTeams,
  dotaTeams,
  uncategorizedTeams,
  csStatusFilter,
  dotaStatusFilter,
  csStatusCounts,
  dotaStatusCounts,
  chartCardShadow,
  onCsStatusFilterChange,
  onDotaStatusFilterChange,
  onAddNew,
  getStatusFilterBadge,
  renderTeamCard,
}: RiskTeamTablesProps) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CS Teams */}
        <Card
          className="border border-gray-300 rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: chartCardShadow }}
        >
          <CardHeader className="bg-white border-b border-gray-200 pt-6 px-6 pb-3">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
              <span className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Users className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                </div>
                CS команди
              </span>
            </CardTitle>
            <div className="flex flex-nowrap items-center gap-1 mt-0 mb-0 py-1">
              <button
                onClick={() => onCsStatusFilterChange("all")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${csStatusFilter === "all" ? "bg-gray-900 text-white ring-2 ring-offset-1 ring-gray-900" : "bg-gray-100 text-gray-700 border border-gray-200 opacity-70 hover:opacity-100"}`}
              >
                Всі ({csStatusCounts.all})
              </button>
              {ALL_STATUSES.map((status) => {
                const count = csStatusCounts[status] || 0;
                if (count === 0 && csStatusFilter !== status) return null;
                return (
                  <button
                    key={status}
                    onClick={() =>
                      onCsStatusFilterChange(
                        csStatusFilter === status ? "all" : status,
                      )
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${getStatusFilterBadge(status, csStatusFilter === status)}`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {csTeams.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                    <Users
                      className="h-16 w-16 text-gray-400"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Немає команд CS
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    {csStatusFilter !== "all"
                      ? `Немає CS команд зі статусом "${csStatusFilter}"`
                      : "Додайте ризиковані команди CS для відстеження"}
                  </p>
                  {csStatusFilter !== "all" ? (
                    <Button
                      onClick={() => onCsStatusFilterChange("all")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" strokeWidth={2} />
                      Скинути фільтр
                    </Button>
                  ) : (
                    <Button
                      onClick={onAddNew}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold transition-colors"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      Додати команду
                    </Button>
                  )}
                </div>
              ) : (
                csTeams.map((team) => {
                  const globalIndex = allTeams.findIndex((t) => t === team);
                  return renderTeamCard(team, globalIndex);
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dota Teams */}
        <Card
          className="border border-gray-300 rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: chartCardShadow }}
        >
          <CardHeader className="bg-white border-b border-gray-200 pt-6 px-6 pb-3">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
              <span className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Users className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                </div>
                Dota 2 команди
              </span>
            </CardTitle>
            <div className="flex flex-nowrap items-center gap-1 mt-0 mb-0 py-1">
              <button
                onClick={() => onDotaStatusFilterChange("all")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${dotaStatusFilter === "all" ? "bg-gray-900 text-white ring-2 ring-offset-1 ring-gray-900" : "bg-gray-100 text-gray-700 border border-gray-200 opacity-70 hover:opacity-100"}`}
              >
                Всі ({dotaStatusCounts.all})
              </button>
              {ALL_STATUSES.map((status) => {
                const count = dotaStatusCounts[status] || 0;
                if (count === 0 && dotaStatusFilter !== status) return null;
                return (
                  <button
                    key={status}
                    onClick={() =>
                      onDotaStatusFilterChange(
                        dotaStatusFilter === status ? "all" : status,
                      )
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${getStatusFilterBadge(status, dotaStatusFilter === status)}`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {dotaTeams.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                    <Users
                      className="h-16 w-16 text-gray-400"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Немає команд Dota 2
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    {dotaStatusFilter !== "all"
                      ? `Немає Dota 2 команд зі статусом "${dotaStatusFilter}"`
                      : "Додайте ризиковані команди Dota 2 для відстеження"}
                  </p>
                  {dotaStatusFilter !== "all" ? (
                    <Button
                      onClick={() => onDotaStatusFilterChange("all")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" strokeWidth={2} />
                      Скинути фільтр
                    </Button>
                  ) : (
                    <Button
                      onClick={onAddNew}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold transition-colors"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      Додати команду
                    </Button>
                  )}
                </div>
              ) : (
                dotaTeams.map((team) => {
                  const globalIndex = allTeams.findIndex((t) => t === team);
                  return renderTeamCard(team, globalIndex);
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Uncategorized Teams */}
        {uncategorizedTeams.length > 0 && (
          <Card
            className="border border-amber-200 rounded-2xl bg-white overflow-hidden lg:col-span-2"
            style={{ boxShadow: chartCardShadow }}
          >
            <CardHeader className="bg-amber-50 border-b border-amber-200 p-6">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                <span className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl">
                    <Pencil
                      className="h-5 w-5 text-amber-600"
                      strokeWidth={1.5}
                    />
                  </div>
                  Без категорії
                </span>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 font-semibold text-sm">
                  {uncategorizedTeams.length}
                </Badge>
              </CardTitle>
              <p className="text-sm text-amber-800 mt-2 flex items-center gap-1.5">
                <Info className="h-4 w-4" strokeWidth={1.5} />
                Команди без визначеної гри або статусу.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {uncategorizedTeams.map((team) => {
                  const globalIndex = allTeams.findIndex((t) => t === team);
                  return renderTeamCard(team, globalIndex);
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
