// ═══════════════════════════════════════════
// useExpressBuilder — express bet events management
// ═══════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react";
import type { MatchPrefillData } from "@/components/CS2BettingForm";

export interface ExpressEvent {
  match: string;
  betType: string;
  selection: string;
  odds: string;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
}

interface UseExpressBuilderOptions {
  expressMatchesData?: MatchPrefillData[] | null;
  onExpressMatchesConsumed?: () => void;
}

export function useExpressBuilder({
  expressMatchesData,
  onExpressMatchesConsumed,
}: UseExpressBuilderOptions) {
  const [events, setEvents] = useState<ExpressEvent[]>(() => {
    if (expressMatchesData && expressMatchesData.length >= 2) {
      return expressMatchesData.map((m) => ({
        match: `${m.team1} vs ${m.team2}`,
        betType: "Match Winner",
        selection: m.team1,
        odds: "",
        logoTeam1: m.logoTeam1,
        logoTeam2: m.logoTeam2,
      }));
    }
    return [];
  });

  const consumedRef = useRef(!!(expressMatchesData && expressMatchesData.length >= 2));
  const onConsumedRef = useRef(onExpressMatchesConsumed);
  onConsumedRef.current = onExpressMatchesConsumed;

  // Auto-fill from Matches page
  useEffect(() => {
    if (expressMatchesData && expressMatchesData.length >= 2 && !consumedRef.current) {
      consumedRef.current = true;
      const prefilled: ExpressEvent[] = expressMatchesData.map((m) => ({
        match: `${m.team1} vs ${m.team2}`,
        betType: "Match Winner",
        selection: m.team1,
        odds: "",
        logoTeam1: m.logoTeam1,
        logoTeam2: m.logoTeam2,
      }));
      setEvents(prefilled);
      setTimeout(() => onConsumedRef.current?.(), 0);
    }
    if (!expressMatchesData) consumedRef.current = false;
  }, [expressMatchesData]);

  const addEvent = useCallback((event: ExpressEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const removeEvent = useCallback((index: number) => {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateEvent = useCallback((index: number, update: Partial<ExpressEvent>) => {
    setEvents((prev) => prev.map((e, i) => (i === index ? { ...e, ...update } : e)));
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  /** Calculate total odds for all events */
  const totalOdds = events.reduce((acc, e) => acc * (parseFloat(e.odds) || 1), 1);

  return { events, setEvents, addEvent, removeEvent, updateEvent, clearEvents, totalOdds };
}
