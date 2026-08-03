import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { logRender } from "@/lib/devLogger";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  Calendar,
  Trophy,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  PlusCircle,
  Layers,
  X,
} from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { BlurFade } from "@/components/ui/blur-fade";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/PageHeader";
import AIRecommendationModal from "@/components/AIRecommendationModal";
import PredictionsModal from "@/components/PredictionsModal";
import CommentModal from "@/components/CommentModal";
import AddToRiskyTeamsModal from "@/components/matches/AddToRiskyTeamsModal";
import MatchRow from "@/components/matches/MatchRow";
import MatchFilterBar from "@/components/matches/MatchFilterBar";
import DateStatsCards from "@/components/matches/DateStatsCards";
import PastDaysModal from "@/components/matches/PastDaysModal";
import { MatchesSkeleton } from "@/components/matches/MatchStates";
import { useMatches, type Match, type SortBy } from "@/hooks/useMatches";

export type { Match } from "@/hooks/useMatches";

const colDivider = "border-r border-gray-200";

const getTodayDateKey = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatFullDateTitle = (
  dateKey: string,
  gameFilter: "all" | "CS2" | "Dota2",
): string => {
  const d = new Date(dateKey + "T12:00:00");
  const dayNames = [
    "Неділя",
    "Понеділок",
    "Вівторок",
    "Середа",
    "Четвер",
    "П'ятниця",
    "Субота",
  ];
  const dayFull = dayNames[d.getDay()];
  const formatted = d.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const prefix =
    gameFilter === "CS2"
      ? "CS2 матчі"
      : gameFilter === "Dota2"
        ? "Dota 2 матчі"
        : "Матчі";
  return `${prefix} (${dayFull}, ${formatted})`;
};

export default function Matches() {
  logRender("Matches");
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const m = useMatches();

  const renderSortIndicator = (column: SortBy) => {
    const dir = m.getSortIcon(column);
    if (dir === "asc")
      return <ArrowUp className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} />;
    if (dir === "desc")
      return (
        <ArrowDown className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} />
      );
    return (
      <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
    );
  };

  const renderTableHeader = () => (
    <thead>
      <tr className="bg-white border-b border-gray-200">
        {m.visibleColumns.has("rating") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors select-none ${colDivider}`}
            onClick={() => m.toggleSort("rating")}
          >
            <div className="flex items-center justify-center gap-1">
              <span>Інтерес</span>
              {renderSortIndicator("rating")}
            </div>
          </th>
        )}
        {m.visibleColumns.has("match") && (
          <th
            className={`text-left py-4 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none ${colDivider}`}
            onClick={() => m.toggleSort("date")}
          >
            <div className="flex items-center justify-between w-full">
              <span>Матч</span>
              {renderSortIndicator("date")}
            </div>
          </th>
        )}
        {m.visibleColumns.has("score") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider ${colDivider}`}
          >
            Рахунок
          </th>
        )}
        {m.visibleColumns.has("ai") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider ${colDivider}`}
          >
            Аналіз
          </th>
        )}
        {m.visibleColumns.has("prediction") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider ${colDivider}`}
          >
            Прогноз
          </th>
        )}
        {m.visibleColumns.has("odds") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none ${colDivider}`}
            onClick={() => m.toggleSort("odds")}
          >
            <div className="flex items-center justify-center gap-1">
              <span>Коеф.</span>
              {renderSortIndicator("odds")}
            </div>
          </th>
        )}
        {m.visibleColumns.has("notes") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap ${colDivider}`}
          >
            Нотатки
          </th>
        )}
        {m.visibleColumns.has("actions") && (
          <th className="text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap min-w-[110px]">
            Додати до Записів
          </th>
        )}
      </tr>
    </thead>
  );

  const renderRow = (match: Match) => (
    <MatchRow
      key={match.id}
      match={match}
      aiPredictions={m.aiPredictions}
      isSelected={m.selectedMatchIds.has(match.id)}
      currentRating={m.matchRatings[match.id] || null}
      colDivider={colDivider}
      visibleColumns={m.visibleColumns}
      onRate={m.handleRateMatch}
      onAIRecommend={(match: Match) => {
        void m.handleAiRecommend(match);
      }}
      onPredictions={(match: Match) => {
        m.setSelectedMatch(match);
        m.setPredictionsModalOpen(true);
      }}
      onShowComment={m.handleShowComment}
      onAddToBets={m.handleAddToBets}
      onToggleSelect={m.toggleMatchSelection}
      onAddToRisky={m.handleAddToRisky}
      team1Risky={!!m.getTeamRiskInfo(match.team1, match.game)}
      team2Risky={!!m.getTeamRiskInfo(match.team2, match.game)}
    />
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f3f3f3] relative flex flex-col">
        <PageHeader
          title="Матчі"
          currentUser={user?.username || "User"}
          isDarkTheme={theme === "dark"}
          onToggleTheme={toggleTheme}
          showThemeToggle={false}
        />
        <div className="relative z-10 flex flex-col gap-y-6 px-6 lg:px-8 pb-8 pt-4 flex-1 min-h-0">
          <DateStatsCards
            displayCount={m.displayCount}
            cs2DisplayedCount={m.cs2DisplayedCount}
            dota2DisplayedCount={m.dota2DisplayedCount}
            liveCount={m.liveCount}
            upcomingCount={m.upcomingCount}
            finishedCount={m.finishedCount}
            avgConfidence={m.avgConfidence}
          />

          <MatchFilterBar
            isLoading={m.isLoading}
            searchQuery={m.searchQuery}
            onSearchChange={m.setSearchQuery}
            filterStatus={m.filterStatus}
            onStatusChange={m.setFilterStatus}
            filterMatchType={m.filterMatchType}
            onMatchTypeChange={m.setFilterMatchType}
            filterTournament={m.filterTournament}
            tournamentOptions={m.tournamentOptions}
            onTournamentChange={m.setFilterTournament}
            filterDayOfWeek={m.filterDayOfWeek}
            onDayChange={m.setFilterDayOfWeek}
            visibleColumns={m.visibleColumns}
            onToggleColumn={m.toggleColumn}
            hasActiveFilters={m.hasActiveFilters}
            onReset={m.resetAllFilters}
            onRefresh={m.refreshMatches}
            onPastDaysOpen={() => m.setPastDaysModalOpen(true)}
          />

          {m.initialLoading ? (
            <MatchesSkeleton />
          ) : (
            <ErrorBoundary>
              {(() => {
                const visibleDateKeys = m.sortedDateKeys.filter(
                  (dk) => (m.groupedByDate[dk]?.length || 0) > 0,
                );

                if (visibleDateKeys.length === 0) {
                  return (
                    <div className="relative bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                      <div className="relative z-10 bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.10)] overflow-hidden">
                        <CardHeader className="bg-white rounded-t-[24px] border-b border-gray-200 px-6 py-5">
                          <CardTitle>
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                                <Calendar
                                  className="h-5 w-5 text-primary"
                                  strokeWidth={2}
                                />
                              </div>
                              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                                {formatFullDateTitle(
                                  getTodayDateKey(),
                                  m.filterGame,
                                )}
                              </span>
                              <div className="flex items-center gap-1 ml-auto">
                                {(["all", "CS2", "Dota2"] as const).map((g) => (
                                  <button
                                    key={g}
                                    onClick={() => m.setFilterGame(g)}
                                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                                      m.filterGame === g
                                        ? g === "CS2"
                                          ? "bg-amber-600 text-white shadow-md"
                                          : g === "Dota2"
                                            ? "bg-[#7C3AED] text-white shadow-md"
                                            : "bg-gray-900 text-white shadow-md"
                                        : "bg-white text-gray-500 border border-gray-200 hover:text-gray-900 hover:border-gray-300"
                                    }`}
                                  >
                                    {g === "all" ? "Всі" : g}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 rounded-b-[24px]">
                          <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400 gap-3 py-16">
                            <div className="p-8 bg-gray-100 rounded-2xl mb-6">
                              <Trophy
                                className="h-16 w-16 text-gray-400"
                                strokeWidth={1.5}
                              />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {m.filterGame === "Dota2"
                                ? "Сьогодні немає матчів Dota 2"
                                : m.filterGame === "CS2"
                                  ? "Сьогодні немає матчів CS2"
                                  : "Немає матчів"}
                            </h3>
                            <p className="text-gray-500 text-sm max-w-xs text-center mb-4">
                              {m.filterGame === "Dota2"
                                ? "Матчі з'являться тут, щойно розклад оновиться. Спробуйте «Всі» або «CS2»."
                                : m.filterGame === "CS2"
                                  ? "Матчі з'являться тут, щойно розклад оновиться. Спробуйте «Всі» або «Dota2»."
                                  : "Спробуйте змінити фільтри або натисніть «Оновити», щоб завантажити свіжі дані."}
                            </p>
                            <button
                              onClick={m.refreshMatches}
                              disabled={m.isLoading}
                              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-[24px] bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <RefreshCw
                                className="h-4 w-4"
                                strokeWidth={1.5}
                              />{" "}
                              Оновити
                            </button>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  );
                }

                return visibleDateKeys.map((dateKey, idx) => {
                  const dateMatches = m.groupedByDate[dateKey];
                  const hasLive = dateMatches.some(
                    (mt) => mt.matchStatus === "live",
                  );
                  return (
                    <BlurFade key={dateKey} delay={idx * 0.1} inView>
                      <div className="relative bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                        {hasLive && (
                          <BorderBeam
                            size={200}
                            duration={4}
                            colorFrom="#EF4444"
                            colorTo="#F59E0B"
                            borderWidth={2}
                            className="rounded-[32px]"
                          />
                        )}
                        <div className="relative z-10 bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.10)] overflow-x-auto">
                          <CardHeader className="bg-white rounded-t-[24px] border-b border-gray-200 px-6 py-5">
                            <CardTitle>
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                                  <Calendar
                                    className="h-5 w-5 text-primary"
                                    strokeWidth={2}
                                  />
                                </div>
                                <span className="text-2xl font-bold text-gray-900 tracking-tight">
                                  {formatFullDateTitle(dateKey, m.filterGame)}
                                </span>
                                <Badge className="bg-gray-100 text-gray-500 border-0 rounded-full px-4 py-1 text-base font-bold">
                                  {dateMatches.length}
                                </Badge>
                                <div className="flex items-center gap-1 ml-auto">
                                  {(["all", "CS2", "Dota2"] as const).map(
                                    (g) => (
                                      <button
                                        key={g}
                                        onClick={() => m.setFilterGame(g)}
                                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                                          m.filterGame === g
                                            ? g === "CS2"
                                              ? "bg-amber-600 text-white shadow-md"
                                              : g === "Dota2"
                                                ? "bg-[#7C3AED] text-white shadow-md"
                                                : "bg-gray-900 text-white shadow-md"
                                            : "bg-white text-gray-500 border border-gray-200 hover:text-gray-900 hover:border-gray-300"
                                        }`}
                                      >
                                        {g === "all" ? "Всі" : g}
                                      </button>
                                    ),
                                  )}
                                </div>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0 rounded-b-[24px]">
                            {dateMatches.length > 0 ? (
                              <div>
                                <table className="w-full border-collapse">
                                  {renderTableHeader()}
                                  <tbody>{dateMatches.map(renderRow)}</tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400 gap-3">
                                <div className="p-8 bg-gray-100 rounded-2xl mb-6">
                                  <Trophy
                                    className="h-16 w-16 text-gray-400"
                                    strokeWidth={1.5}
                                  />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                  Немає матчів
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">
                                  Спробуйте обрати інший фільтр гри або
                                  натисніть «Оновити»
                                </p>
                                <button
                                  onClick={m.refreshMatches}
                                  disabled={m.isLoading}
                                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-[24px] bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                  <RefreshCw
                                    className="h-4 w-4"
                                    strokeWidth={1.5}
                                  />{" "}
                                  Оновити
                                </button>
                              </div>
                            )}
                          </CardContent>
                        </div>
                      </div>
                    </BlurFade>
                  );
                });
              })()}
            </ErrorBoundary>
          )}

          <AIRecommendationModal
            open={m.aiModalOpen}
            onClose={() => m.setAiModalOpen(false)}
            matchInfo={
              m.selectedMatch
                ? `${m.selectedMatch.team1} vs ${m.selectedMatch.team2} (${m.selectedMatch.matchType}, ${m.selectedMatch.tier?.toUpperCase() ?? "-"})`
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

          <CommentModal
            open={m.commentModalOpen}
            onClose={() => m.setCommentModalOpen(false)}
            matchInfo={
              m.selectedCommentMatch
                ? `${m.selectedCommentMatch.team1} vs ${m.selectedCommentMatch.team2} (${m.selectedCommentMatch.matchType}, ${m.selectedCommentMatch.tier?.toUpperCase() ?? "-"})`
                : ""
            }
            comment={
              m.selectedCommentMatch
                ? m.getMatchRiskComments(
                    m.selectedCommentMatch.team1,
                    m.selectedCommentMatch.team2,
                    m.selectedCommentMatch.game,
                  )
                : ""
            }
          />

          <AddToRiskyTeamsModal
            open={m.riskyModalOpen}
            onClose={() => m.setRiskyModalOpen(false)}
            team1={{
              name: m.selectedRiskyMatch?.team1 || "",
              logo: m.selectedRiskyMatch?.logoTeam1,
            }}
            team2={{
              name: m.selectedRiskyMatch?.team2 || "",
              logo: m.selectedRiskyMatch?.logoTeam2,
            }}
            onSaved={m.handleRiskySaved}
          />

          <PastDaysModal
            open={m.pastDaysModalOpen}
            onClose={() => m.setPastDaysModalOpen(false)}
          />
        </div>

        {m.selectedMatchIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div
              className="flex items-center gap-4 px-6 py-4 bg-gray-900 text-white rounded-2xl border border-gray-700"
              style={{
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-[#60A5FA]" strokeWidth={1.5} />
                <span className="text-base font-semibold">
                  Експрес: {m.selectedMatchIds.size}{" "}
                  {m.selectedMatchIds.size === 1
                    ? "матч"
                    : m.selectedMatchIds.size <= 4
                      ? "матчі"
                      : "матчів"}
                </span>
              </div>
              <div className="w-px h-8 bg-gray-700" />
              <Button
                onClick={m.handleCreateExpress}
                disabled={m.selectedMatchIds.size < 2}
                className={`rounded-xl font-medium text-sm px-5 py-2.5 transition-all duration-200 ${m.selectedMatchIds.size >= 2 ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
              >
                <PlusCircle className="h-4 w-4 mr-2" strokeWidth={1.5} />{" "}
                Створити Експрес
              </Button>
              <button
                onClick={m.clearSelectedMatches}
                className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Очистити вибір"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
