import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { getStatusBadge } from "@/lib/displayHelpers";
import type { RiskyTeam } from "./sidebar-types";

function getGameBadge(game: string): { label: string; className: string } {
  const g = game.toLowerCase();
  const isDota = g.includes("дота") || g.includes("dota");
  return isDota
    ? {
        label: "Dota 2",
        className:
          "bg-violet-100 text-[#5B21B6] border border-violet-200 whitespace-nowrap rounded-full font-medium text-sm px-3 py-1 min-w-[72px] text-center inline-block",
      }
    : {
        label: "CS2",
        className:
          "bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap rounded-full font-medium text-sm px-3 py-1 min-w-[72px] text-center inline-block",
      };
}

interface SidebarRiskyTeamsProps {
  riskyTeams: RiskyTeam[];
}

export default function SidebarRiskyTeams({
  riskyTeams,
}: SidebarRiskyTeamsProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = useCallback((index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <div
      className="bg-white border border-gray-300 rounded-3xl overflow-hidden flex flex-col"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
        </div>
        <span className="text-lg font-semibold text-gray-900">
          Ризиковані команди
        </span>
      </div>

      <div
        className={
          riskyTeams.length > 0
            ? "p-6 flex flex-col flex-1 bg-gray-100"
            : "p-6 flex flex-col flex-1"
        }
      >
        {riskyTeams.length > 0 ? (
          <div className="space-y-2.5">
            {riskyTeams.map((riskyTeam, index) => {
              const isOpen = expanded.has(index);
              return (
                <div
                  key={index}
                  className="p-3.5 border border-blue-500 rounded-2xl bg-white hover:border-blue-500 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    className="w-full text-left space-y-2"
                  >
                    {/* Row 1: logo + name + chevron */}
                    <div className="flex items-center gap-2">
                      {riskyTeam.logo && (
                        <img
                          src={riskyTeam.logo}
                          alt={riskyTeam.name}
                          className="h-7 w-7 rounded-full object-contain bg-gray-100 flex-shrink-0"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                      )}
                      <span className="text-base font-semibold text-gray-900 truncate flex-1 min-w-0">
                        {riskyTeam.name}
                      </span>
                      {riskyTeam.notes && (
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0">
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </span>
                      )}
                    </div>
                    {/* Row 2: badges */}
                    <div className="flex items-center gap-1.5">
                      {riskyTeam.game && (
                        <Badge
                          className={getGameBadge(riskyTeam.game).className}
                        >
                          {getGameBadge(riskyTeam.game).label}
                        </Badge>
                      )}
                      <Badge className={getStatusBadge(riskyTeam.status)}>
                        {riskyTeam.status}
                      </Badge>
                    </div>
                  </button>

                  {/* Expandable notes */}
                  {isOpen && riskyTeam.notes && (
                    <>
                      <div className="border-t border-gray-100 my-2.5" />
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-xl">
                        {riskyTeam.notes}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mx-auto mb-3">
              <AlertTriangle
                className="h-7 w-7 text-gray-400"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Усі команди безпечні
            </p>
            <p className="text-xs text-gray-400">
              Ризиковані команди не знайдено
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
