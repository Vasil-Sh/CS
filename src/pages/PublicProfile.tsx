/**
 * Public Profile — shareable stats page
 * Route: /user/:username — no auth required
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  TrendingUp, DollarSign, Target, Trophy, BarChart3,
  Zap, Calendar, Loader2, Share2, ArrowLeft, Wallet,
} from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
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
      <div className="min-h-screen bg-[#f3f3f3] flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Профіль не знайдено"}
          </h1>
          <p className="text-gray-500 mb-4">Цей користувач ще не поділився своєю статистикою</p>
          <Link to="/" className="text-primary font-medium hover:underline">
            ← На головну
          </Link>
        </div>
      </div>
    );
  }

  const { stats } = data;
  const isUp = stats.totalProfit >= 0;

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">@{data.username}</h1>
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

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-gray-500">Банк</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              <NumberTicker value={Math.round(stats.currentBank)} /> ₴
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-500" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-gray-500">Профіт</span>
            </div>
            <div className={`text-xl font-bold ${isUp ? "text-green-600" : "text-red-500"}`}>
              {isUp ? "+" : ""}<NumberTicker value={Math.round(stats.totalProfit)} /> ₴
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Target className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-gray-500">Вінрейт</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{stats.winRate}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-violet-500" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-gray-500">ROI</span>
            </div>
            <div className={`text-xl font-bold ${stats.roi >= 0 ? "text-green-600" : "text-red-500"}`}>
              {stats.roi >= 0 ? "+" : ""}{stats.roi}%
            </div>
          </div>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ROI Circle */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 flex flex-col items-center justify-center">
            <span className="text-sm text-gray-500 mb-4">ROI</span>
            <AnimatedCircularProgressBar
              max={100} min={0}
              value={Math.abs(stats.roi) >= 100 ? 98 : Math.abs(stats.roi)}
              gaugePrimaryColor={stats.roi >= 0 ? "#10B981" : "#EF4444"}
              gaugeSecondaryColor="#E5E7EB"
              className="!w-28 !h-28"
            />
            <span className={`text-2xl font-bold mt-3 ${stats.roi >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {stats.roi >= 0 ? "+" : ""}{stats.roi}%
            </span>
            <div className="grid grid-cols-2 gap-2 mt-4 w-full">
              <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                <div className="text-[10px] text-gray-400 uppercase">Вкладено</div>
                <div className="text-sm font-bold"><NumberTicker value={Math.round(stats.totalStaked)} /> ₴</div>
              </div>
              <div className={`rounded-xl px-3 py-2 text-center ${isUp ? "bg-emerald-50" : "bg-red-50"}`}>
                <div className={`text-[10px] uppercase ${isUp ? "text-emerald-600" : "text-red-500"}`}>Прибуток</div>
                <div className={`text-sm font-bold ${isUp ? "text-emerald-700" : "text-red-600"}`}>
                  {isUp ? "+" : ""}<NumberTicker value={Math.round(stats.totalProfit)} /> ₴
                </div>
              </div>
            </div>
          </div>

          {/* Numbers */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Всього ставок</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalBets}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-green-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Виграші / Програші</p>
                <p className="text-lg font-bold text-gray-900">
                  <span className="text-green-600">{stats.wins}</span> / <span className="text-red-500">{stats.losses}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                <Zap className="h-4 w-4 text-sky-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Середній коеф.</p>
                <p className="text-lg font-bold text-gray-900">{stats.avgOdds}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Target className="h-4 w-4 text-violet-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Активні цілі</p>
                <p className="text-lg font-bold text-gray-900">{stats.activeGoals}</p>
              </div>
            </div>
          </div>

          {/* Recent bets */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">Останні ставки</span>
            </div>
            {data.recentBets.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Немає ставок</p>
            ) : (
              <div className="space-y-2">
                {data.recentBets.map((bet, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{bet.match}</p>
                      <p className="text-xs text-gray-400">{bet.game} · {bet.date}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`text-sm font-semibold ${bet.result === "Win" ? "text-green-600" : bet.result === "Loss" ? "text-red-500" : "text-gray-400"}`}>
                        {bet.result === "Win" ? `+${bet.profit} ₴` : bet.result === "Loss" ? `${bet.profit} ₴` : "..."}
                      </p>
                      <p className="text-xs text-gray-400">@{bet.odds}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Monthly profit */}
        {data.monthlyProfit.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Прибуток по місяцях</h3>
            <div className="flex items-end gap-2 h-32">
              {data.monthlyProfit.map((m) => {
                const maxAbs = Math.max(...data.monthlyProfit.map(x => Math.abs(x.profit)), 1);
                const h = Math.max(4, Math.round((Math.abs(m.profit) / maxAbs) * 100));
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] text-gray-500 tabular-nums">
                      {m.profit >= 0 ? "+" : ""}{Math.round(m.profit)} ₴
                    </span>
                    <div
                      className={`w-full rounded-t-md ${m.profit >= 0 ? "bg-green-400" : "bg-red-400"}`}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-gray-400 truncate w-full text-center">{fmtMonth(m.month)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pb-8">
          Статистика оновлюється автоматично ·{" "}
          <Link to="/" className="text-primary hover:underline">
            MatchIQ
          </Link>
        </div>
      </div>
    </div>
  );
}
