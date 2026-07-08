import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserDataService } from "@/lib/userDataService";
import { useAppStore } from "@/stores/appStore";
import { logRender } from "@/lib/devLogger";
import RiskManagement from "@/components/RiskManagement";

interface Bet {
  id?: string | number;
  date: string;
  amount: number;
  originalAmount?: number;
  profit?: number;
  originalProfit?: number;
  result: string;
  odds?: number;
  strategy?: string;
  [key: string]: unknown;
}

export default function RiskyTeams() {
  logRender("RiskyTeams");
  const { user } = useAuth();
  const currentUser = user?.username || "default";
  const strategyVersion = useAppStore((s) => s.strategyVersion);
  const [bets, setBets] = useState<Bet[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await UserDataService.fetchBets();
        setBets((fetched as Bet[]) || []);
      } catch {
        const local = UserDataService.getUserData<Bet[]>(
          currentUser,
          "mybets_data",
          [],
        );
        setBets(local || []);
      }
    })();
  }, [currentUser, strategyVersion]);

  return <RiskManagement bets={bets} />;
}
