import { useTheme } from "@/hooks/useTheme";
import { logRender } from "@/lib/devLogger";
import { PageHeader } from "@/components/PageHeader";
import RiskManagement from "@/components/RiskManagement";

export default function RiskyTeams() {
  logRender("RiskyTeams");
  const { theme } = useTheme();

  const isDarkTheme = theme === "dark";

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative flex flex-col">
      <PageHeader
        title="Ризиковані команди"
        currentUser="User"
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => {}}
        showThemeToggle={false}
      />
      <div className="relative z-10 space-y-6 px-6 lg:px-8 pb-8 pt-4 flex flex-col flex-1 min-h-0">
        <RiskManagement />
      </div>
    </div>
  );
}
