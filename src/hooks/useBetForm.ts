// ═══════════════════════════════════════════
// useBetForm — form state management for CS2BettingForm
// Extracted from CS2BettingForm.tsx (1539 → smaller)
// ═══════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react";
import type { MatchPrefillData } from "@/components/CS2BettingForm";

export interface FormData {
  date: string;
  game: "CS2" | "Dota2";
  matchUrl: string;
  tournament: string;
  team1: string;
  team2: string;
  format: string;
  riskyTeams: { name: string; game: string; status: string; notes: string }[];
  betType: string;
  betCategory: string;
  selection: string;
  odds: string;
  stake: string;
  currency: string;
  exchangeRate: string;
  confidence: string;
  strategy: string;
  reasoning: string;
  keyFactors: string;
  riskLevel: string;
  notes: string;
  goalId: string;
}

export const getDefaultFormData = (strategyName?: string, betCategory?: string): FormData => ({
  date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
  game: "CS2" as "CS2" | "Dota2",
  matchUrl: "",
  tournament: "",
  team1: "",
  team2: "",
  format: "BO3",
  riskyTeams: [],
  betType: "",
  betCategory: betCategory || "Ординар",
  selection: "",
  odds: "",
  stake: "",
  currency: "UAH",
  exchangeRate: (() => { try { return localStorage.getItem("matchiq_exchange_rate") || "41.50"; } catch { return "41.50"; } })(),
  confidence: "",
  strategy: strategyName || "",
  reasoning: "",
  keyFactors: "",
  riskLevel: "",
  notes: "",
  goalId: "",
});

interface UseBetFormOptions {
  primaryStrategyName?: string;
  prefillData?: MatchPrefillData | null;
  expressMatchesData?: MatchPrefillData[] | null;
}

export function useBetForm({
  primaryStrategyName,
  prefillData,
  expressMatchesData,
}: UseBetFormOptions) {
  const initialCategory =
    expressMatchesData && expressMatchesData.length >= 2 ? "Експрес" : "Ординар";

  const [formData, setFormData] = useState<FormData>(() => {
    const defaults = getDefaultFormData(undefined, initialCategory);
    if (prefillData?.game) {
      defaults.game = prefillData.game;
      if (prefillData.format) defaults.format = prefillData.format;
    }
    return defaults;
  });

  const [isPrefilled, setIsPrefilled] = useState(false);
  const [isExpressFromMatches, setIsExpressFromMatches] = useState(false);
  const prefillConsumedRef = useRef(false);
  const prefillLogosRef = useRef<{ logoTeam1?: string | null; logoTeam2?: string | null }>({});

  /** Apply prefill data from Matches page (runs once per prefillData change) */
  useEffect(() => {
    if (!prefillData) {
      prefillConsumedRef.current = false;
      return;
    }
    if (prefillConsumedRef.current) return;
    prefillConsumedRef.current = true;
    prefillLogosRef.current = {
      logoTeam1: prefillData.logoTeam1,
      logoTeam2: prefillData.logoTeam2,
    };
    const formatMap: Record<string, string> = { Bo1: "BO1", Bo2: "BO2", Bo3: "BO3", Bo5: "BO5" };
    setFormData((prev) => ({
      ...prev,
      team1: prefillData.team1 || "",
      team2: prefillData.team2 || "",
      tournament: prefillData.tournament || "",
      format: formatMap[prefillData.format] || prefillData.format || "BO3",
      date: prefillData.date ? prefillData.date.split("T")[0] : prev.date,
      matchUrl: prefillData.matchUrl || "",
      odds: prefillData.odds || "",
      game: prefillData.game || prev.game,
    }));
  }, [prefillData]);

  const clearForm = useCallback(() => {
    setFormData(getDefaultFormData(primaryStrategyName));
    setIsPrefilled(false);
    setIsExpressFromMatches(false);
    prefillConsumedRef.current = false;
  }, [primaryStrategyName]);

  const setField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    formData,
    setFormData,
    isPrefilled,
    setIsPrefilled,
    isExpressFromMatches,
    setIsExpressFromMatches,
    prefillLogosRef,
    clearForm,
    setField,
  };
}
