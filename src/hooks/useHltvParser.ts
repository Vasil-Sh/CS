// ═══════════════════════════════════════════
// useHltvParser — HLTV/Dota2 match URL parsing
// ═══════════════════════════════════════════

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { parseDota2MatchFromUrl, parseCS2MatchFromUrl } from "@/lib/matchUrlParser";
import { UserDataService } from "@/lib/userDataService";
import { normalizeTeamName } from "@/lib/utils";

interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

interface ParseResult {
  game: "CS2" | "Dota2";
  team1: string;
  team2: string;
  tournament: string;
  riskyTeams: RiskyTeam[];
}

interface UseHltvParserOptions {
  currentUser: string;
}

export function useHltvParser({ currentUser }: UseHltvParserOptions) {
  const [isParsing, setIsParsing] = useState(false);

  const loadRiskyTeams = (): RiskyTeam[] => {
    try {
      return UserDataService.getUserData<RiskyTeam[]>(currentUser, "risky_teams", []);
    } catch {
      return [];
    }
  };

  const findMatchingRiskyTeams = (team1: string, team2: string, gameFilter: "CS" | "Dota"): RiskyTeam[] => {
    const allRisky = loadRiskyTeams();
    const n1 = normalizeTeamName(team1);
    const n2 = normalizeTeamName(team2);
    return allRisky.filter((rt) => {
      if (rt.game !== gameFilter) return false;
      const nr = normalizeTeamName(rt.name);
      return n1 === nr || n2 === nr || n1.includes(nr) || n2.includes(nr);
    }).map((rt) => ({ name: rt.name, game: rt.game, status: rt.status, notes: rt.notes }));
  };

  const parse = useCallback(async (url: string): Promise<ParseResult | null> => {
    setIsParsing(true);
    try {
      if (url.includes("dota2")) {
        const result = parseDota2MatchFromUrl(url);
        if (!result) { toast.error("Не вдалося розпарсити Dota 2 URL"); return null; }
        toast.success("Інформацію про Dota 2 матч успішно отримано!");
        return {
          game: "Dota2",
          team1: result.team1,
          team2: result.team2,
          tournament: result.tournament,
          riskyTeams: findMatchingRiskyTeams(result.team1, result.team2, "Dota"),
        };
      }

      if (url.includes("hltv.org/matches/")) {
        const result = parseCS2MatchFromUrl(url);
        if (!result) { toast.error('Не вдалося знайти "vs" у посиланні'); return null; }
        toast.success("Інформацію про CS2 матч успішно отримано!");
        return {
          game: "CS2",
          team1: result.team1,
          team2: result.team2,
          tournament: result.tournament,
          riskyTeams: findMatchingRiskyTeams(result.team1, result.team2, "CS"),
        };
      }

      toast.error("Невідомий формат URL. Підтримуються HLTV (CS2) та Dota 2");
      return null;
    } catch (error) {
      toast.error("Помилка при парсингу URL матчу");
      if (import.meta.env.DEV) console.error(error);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, [loadRiskyTeams, findMatchingRiskyTeams]);

  /** Returns true if URL looks parseable */
  const isParseable = (url: string) =>
    url.includes("hltv.org/matches/") || url.includes("dota2");

  return { isParsing, parse, isParseable };
}
