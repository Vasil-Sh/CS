/**
 * Public Profile — shareable stats page
 * Route: /user/:username — no auth required
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  TrendingUp, DollarSign, Target, Trophy, BarChart3,
  Zap, Loader2, Share2, Wallet, User, Calendar,
} from "lucide-react";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { toast } from "sonner";

interface PublicStats {
  username: string;
  stats: {
    totalBets: number;
    wins: number;
    losses: number;
    winRate: number;
    totalProfit: number;
    totalStaked: number;
    roi: number;
    avgOdds: number;
    currentBank: number;
    activeGoals: number;
  };
  recentBets: { match: string; result: string; profit: number; odds: number; date: string; game: string }[];
  monthlyProfit: { month: string; profit: number }[];
}

const UA_MONTHS = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return `${UA_MONTHS[parseInt(mo, 10) - 1]}'${y?.slice(2)}`;
}

function getApiBase() {
  return import.meta.env.VITE_API_URL || "http://localhost:3001/api";
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`${getApiBase()}/public-profile/${encodeURIComponent(username)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Користувача не знайдено" : "Помилка завантаження");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => toast.success("Посилання скопійовано!"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f3f3f3]">
        <div className="bg-white border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="max-w-[1064px] mx-auto px-6 py-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Профіль не знайдено</h1>
              <p className="text-sm text-gray-500">{error || "Цей користувач ще не поділився своєю статистикою"}</p>
            </div>
          </div>
        </div>
        <div className="text-center py-20">
          <Link to="/" className="text-primary font-medium hover:underline">← На головну</Link>
        </div>
      </div>
    );
  }

  const { stats } = data;
  const isUp = stats.totalProfit >= 0;

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {/* Header — white block matching system style */}
      <div className="bg-white border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1064px] mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">@{data.username}</h1>
              <p className="text-sm text-gray-500">Публічний профіль беттора</p>
            </div>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Поділитися
          </button>
        </div>
      </div>

      {/* KPI Cards — wrapped in stone container like analytics */}
      <div className="max-w-[1064px] mx-auto px-6 pt-6 pb-6 space-y-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <span className="text-sm text-gray-500">Банк</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(stats.currentBank).toLocaleString("uk-UA")} ₴
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" strokeWidth={1.5} />
                </div>
                <span className="text-sm text-gray-500">Профіт</span>
              </div>
              <div className={`text-2xl font-bold ${isUp ? "text-green-600" : "text-red-500"}`}>
                {isUp ? "+" : ""}{Math.round(stats.totalProfit).toLocaleString("uk-UA")} ₴
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Target className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                </div>
                <span className="text-sm text-gray-500">Вінрейт</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.winRate}%</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-violet-500" strokeWidth={1.5} />
                </div>
                <span className="text-sm text-gray-500">ROI</span>
              </div>
              <div className={`text-2xl font-bold ${stats.roi >= 0 ? "text-green-600" : "text-red-500"}`}>
                {stats.roi >= 0 ? "+" : ""}{stats.roi}%
              </div>
            </div>
          </div>
        </div>

        {/* Stats row — ROI + Numbers + Monthly profit (3 columns) */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* ROI Circle */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center">
              <span className="text-base text-gray-500 mb-4">ROI</span>
              <AnimatedCircularProgressBar
                max={100} min={0}
                value={Math.abs(stats.roi) >= 100 ? 98 : Math.abs(stats.roi)}
                gaugePrimaryColor={stats.roi >= 0 ? "#10B981" : "#EF4444"}
                gaugeSecondaryColor="#E5E7EB"
                className="!w-32 !h-32"
              />
              <span className={`text-3xl font-bold mt-4 ${stats.roi >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {stats.roi >= 0 ? "+" : ""}{stats.roi}%
              </span>
              <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                  <div className="text-[10px] text-gray-400 uppercase">Вкладено</div>
                  <div className="text-sm font-bold">{Math.round(stats.totalStaked).toLocaleString("uk-UA")} ₴</div>
                </div>
                <div className={`rounded-xl px-3 py-2 text-center ${isUp ? "bg-emerald-50" : "bg-red-50"}`}>
                  <div className={`text-[10px] uppercase ${isUp ? "text-emerald-600" : "text-red-500"}`}>Прибуток</div>
                  <div className={`text-sm font-bold ${isUp ? "text-emerald-700" : "text-red-600"}`}>
                    {isUp ? "+" : ""}{Math.round(stats.totalProfit).toLocaleString("uk-UA")} ₴
                  </div>
                </div>
              </div>
            </div>

            {/* Numbers */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Всього ставок</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalBets}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-green-500" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Виграші / Програші</p>
                  <p className="text-xl font-bold text-gray-900">
                    <span className="text-green-600">{stats.wins}</span> / <span className="text-red-500">{stats.losses}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-sky-500" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Середній коеф.</p>
                  <p className="text-xl font-bold text-gray-900">{stats.avgOdds}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Target className="h-5 w-5 text-violet-500" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Активні цілі</p>
                  <p className="text-xl font-bold text-gray-900">{stats.activeGoals}</p>
                </div>
              </div>
            </div>

            {/* Monthly profit */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Прибуток по місяцях</h3>
              {data.monthlyProfit.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <Calendar className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-gray-400">Немає даних</p>
                  <p className="text-xs text-gray-300 mt-1">З'являться після перших ставок</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 pr-4 font-medium">Місяць</th>
                      <th className="text-center py-2 px-4 font-medium border-l border-gray-100">Прибуток</th>
                      <th className="text-center py-2 pl-4 font-medium border-l border-gray-100">Результат</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.monthlyProfit.map((m) => (
                      <tr key={m.month} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 pr-4 font-medium text-gray-900">{fmtMonth(m.month)}</td>
                        <td className={`py-2.5 px-4 border-l border-gray-100 text-center tabular-nums font-semibold ${m.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {m.profit >= 0 ? "+" : ""}{Math.round(m.profit).toLocaleString("uk-UA")} ₴
                        </td>
                        <td className="py-2.5 pl-4 border-l border-gray-100 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${m.profit >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                            {m.profit >= 0 ? "▲ Прибуток" : "▼ Збиток"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Recent bets — full width */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Останні ставки</h3>
            {data.recentBets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <Trophy className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-400">Немає ставок</p>
                <p className="text-xs text-gray-300 mt-1">Тут з'являться останні 5 ставок</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="text-left py-2.5 pr-3 font-medium">Дата</th>
                      <th className="text-center py-2.5 px-3 font-medium border-l border-gray-100">Матч</th>
                      <th className="text-center py-2.5 px-3 font-medium border-l border-gray-100 hidden sm:table-cell">Тип</th>
                      <th className="text-center py-2.5 px-3 font-medium border-l border-gray-100">Коеф.</th>
                      <th className="text-center py-2.5 px-3 font-medium border-l border-gray-100">Профіт</th>
                      <th className="text-center py-2.5 pl-3 font-medium border-l border-gray-100">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.recentBets.map((bet, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 pr-3 text-gray-900 whitespace-nowrap">{bet.date}</td>
                        <td className="py-2.5 px-3 border-l border-gray-100 max-w-[200px] text-center">
                          <p className="text-sm font-medium text-gray-900 truncate">{bet.match}</p>
                          <p className="text-xs text-gray-400 sm:hidden">{bet.game}</p>
                        </td>
                        <td className="py-2.5 px-3 border-l border-gray-100 text-gray-900 hidden sm:table-cell text-center">{bet.game}</td>
                        <td className="py-2.5 px-3 border-l border-gray-100 text-center tabular-nums text-gray-900 font-medium">
                          {bet.odds}
                        </td>
                        <td className={`py-2.5 px-3 border-l border-gray-100 text-center tabular-nums font-semibold whitespace-nowrap ${bet.result === "Win" ? "text-green-600" : bet.result === "Loss" ? "text-red-500" : "text-gray-400"}`}>
                          {bet.result === "Win" ? `+${bet.profit}` : bet.result === "Loss" ? `${bet.profit}` : "—"} ₴
                        </td>
                        <td className="py-2.5 pl-3 border-l border-gray-100 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            bet.result === "Win" ? "bg-green-50 text-green-600" :
                            bet.result === "Loss" ? "bg-red-50 text-red-500" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {bet.result === "Win" ? "Виграш" : bet.result === "Loss" ? "Програш" : "Очікується"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-base text-gray-400 pb-8 pt-4">
        Статистика оновлюється автоматично ·{" "}
        <Link to="/" className="text-primary hover:underline">
          MatchIQ
        </Link>
      </div>
    </div>
  );
}
