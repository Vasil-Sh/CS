import { useEffect, useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import AIRecommendationModal from "@/components/AIRecommendationModal";
import PredictionsModal from "@/components/PredictionsModal";
import AddToRiskyTeamsModal from "@/components/matches/AddToRiskyTeamsModal";
import PastDaysModal from "@/components/matches/PastDaysModal";
import MatchSchedule from "@/components/matches/MatchSchedule";
import type { ScheduleAdCampaign } from "@/components/matches/ScheduleAdvertisement";
import { fetchActiveBanner } from "@/lib/bannerApi";
import { useMatches, type Match } from "@/hooks/useMatches";

export type { Match } from "@/hooks/useMatches";

export default function Matches() {
  const m = useMatches();
  const [noteTeam, setNoteTeam] = useState<string>();
  const [banner, setBanner] = useState<ScheduleAdCampaign | null>(null);
  const riskyMatch = m.selectedRiskyMatch;
  const game = riskyMatch?.game || "CS2";
  const team1RiskInfo = m.getTeamRiskInfo(riskyMatch?.team1 || "", game);
  const team2RiskInfo = m.getTeamRiskInfo(riskyMatch?.team2 || "", game);

  useEffect(() => {
    let cancelled = false;
    fetchActiveBanner().then((campaign) => {
      if (!cancelled) setBanner(campaign);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TooltipProvider>
      <ErrorBoundary>
        <MatchSchedule
          model={m}
          advertising={{ campaign: banner, preview: import.meta.env.DEV }}
          onResults={() => m.setPastDaysModalOpen(true)}
          onEditNote={(match, team) => {
            setNoteTeam(team);
            m.handleAddToRisky(match);
          }}
        />
        <AIRecommendationModal
          open={m.aiModalOpen}
          onClose={() => m.setAiModalOpen(false)}
          matchInfo={
            m.selectedMatch
              ? `${m.selectedMatch.team1} vs ${m.selectedMatch.team2} (${m.selectedMatch.matchType})`
              : ""
          }
          recommendation={m.aiRecommendation}
          isLoading={m.aiLoading}
        />
        <PredictionsModal
          open={m.predictionsModalOpen}
          onClose={() => m.setPredictionsModalOpen(false)}
          match={m.selectedMatch}
        />
        <AddToRiskyTeamsModal
          open={m.riskyModalOpen}
          onClose={() => m.setRiskyModalOpen(false)}
          game={game}
          initialTeam={noteTeam}
          team1={{ name: riskyMatch?.team1 || "", logo: riskyMatch?.logoTeam1 }}
          team2={{ name: riskyMatch?.team2 || "", logo: riskyMatch?.logoTeam2 }}
          team1Risky={!!team1RiskInfo}
          team2Risky={!!team2RiskInfo}
          team1Existing={team1RiskInfo}
          team2Existing={team2RiskInfo}
          onSaved={m.handleRiskySaved}
        />
        <PastDaysModal
          open={m.pastDaysModalOpen}
          onClose={() => m.setPastDaysModalOpen(false)}
        />
      </ErrorBoundary>
    </TooltipProvider>
  );
}
