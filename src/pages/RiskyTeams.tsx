import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserDataService } from "@/lib/userDataService";
import { useAppStore } from "@/stores/appStore";
import { useTheme } from "@/hooks/useTheme";
import { logRender } from "@/lib/devLogger";
import { PageHeader } from "@/components/PageHeader";
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
  const { theme } = useTheme();

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

  const isDarkTheme = theme === "dark";

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative flex flex-col">
      <PageHeader
        title="Ризиковані команди"
        currentUser={currentUser || "User"}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => {}}
        showThemeToggle={false}
      />
      <div className="relative z-10 space-y-6 px-6 lg:px-8 pb-8 pt-4 flex flex-col flex-1 min-h-0">
        <RiskManagement bets={bets} />
      </div>
    </div>
  );
}
