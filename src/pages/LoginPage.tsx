import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLogin } from "@/hooks/useLogin";
import {
  Loader2,
  LogIn,
  TrendingUp,
  User,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { SEO } from "@/components/SEO";

interface LoginPageProps {
  /** If true, shows Digesto Demo variant */
  demo?: boolean;
}

export default function LoginPage({ demo = false }: LoginPageProps) {
  const {
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    error,
    handleSubmit,
  } = useLogin();

  const seoTitle = demo ? "Digesto Демо — Увійти" : "Увійти";
  const seoDesc = demo
    ? "Демо-вхід до MatchIQ Digesto — платформи аналітики ставок на CS2."
    : "Увійдіть до MatchIQ — професійної платформи аналітики ставок на CS2. EV-детектор, алгоритм Келлі, трекінг банкролу.";
  const seoCanonical = demo
    ? "https://matchiq.pro/login-digesto-demo"
    : "https://matchiq.pro/login";

  const headingText = demo ? "Digesto Демо" : "Вітаємо знову";
  const subText = demo
    ? "Увійдіть до демо-облікового запису"
    : "Увійдіть до свого облікового запису";
  const footerLinkText = demo ? "Не демо?" : "Потрібна допомога?";
  const footerLinkHref = demo ? "/login" : "#";
  const footerLinkLabel = demo
    ? "Повна версія входу"
    : "Зв'яжіться з підтримкою";

  return (
    <>
      <SEO title={seoTitle} description={seoDesc} canonical={seoCanonical} />
      <div className="min-h-screen relative overflow-hidden bg-[#F5F5F0]">
        <svg
          className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              patternUnits="userSpaceOnUse"
              width="48"
              height="48"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="#000000"
                strokeWidth="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="absolute top-6 left-6 z-20">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[16px] bg-white/80 backdrop-blur-sm border-2 border-stone-200 text-[#4a4a5a] hover:text-[#1a1a2e] hover:border-[#D0CEC4] transition-all duration-200 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            На головну
          </Link>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <Card className="w-full max-w-lg bg-white border-2 border-stone-200 shadow-[0_16px_64px_rgba(0,0,0,0.08)] rounded-[36px] transition-colors duration-300">
            <div className="p-12 space-y-9">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] mb-4 bg-[#1a1a2e] shadow-[0_8px_24px_rgba(26,26,46,0.3)]">
                  <TrendingUp
                    className="w-12 h-12 text-white"
                    strokeWidth={2}
                  />
                </div>
                <h1 className="text-5xl font-semibold text-[#1a1a2e] tracking-tight leading-tight">
                  MatchIQ
                </h1>
                <h2 className="text-2xl font-light text-[#4a4a5a] transition-colors duration-300 leading-tight">
                  {headingText}
                </h2>
                <p className="text-[#8B8B9A] text-sm font-light pt-1">
                  {subText}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="username"
                    className="text-[#2A2A3A] font-medium text-sm flex items-center gap-2"
                  >
                    <User
                      className="h-4 w-4 text-[#8B8B9A]"
                      strokeWidth={1.5}
                    />
                    Ім'я користувача
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Введіть ім'я користувача"
                    required
                    disabled={isLoading}
                    className="h-14 bg-[#F8F8F5] border-2 border-stone-200 rounded-[20px] text-[#2A2A3A] placeholder:text-[#B0B0BA] transition-all duration-300 text-base font-light hover:border-[#D0CEC4] hover:bg-[#FAFAF8] focus:border-[#3e75ff] focus:ring-[#3e75ff]/15 focus:ring-4 focus:bg-white"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="password"
                    className="text-[#2A2A3A] font-medium text-sm flex items-center gap-2"
                  >
                    <Lock
                      className="h-4 w-4 text-[#8B8B9A]"
                      strokeWidth={1.5}
                    />
                    Пароль
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введіть пароль"
                    required
                    disabled={isLoading}
                    className="h-14 bg-[#F8F8F5] border-2 border-stone-200 rounded-[20px] text-[#2A2A3A] placeholder:text-[#B0B0BA] transition-all duration-300 text-base font-light hover:border-[#D0CEC4] hover:bg-[#FAFAF8] focus:border-[#3e75ff] focus:ring-[#3e75ff]/15 focus:ring-4 focus:bg-white"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-[20px] bg-[#FFF0F0] border-2 border-[#FFD4D4]">
                    <p className="text-sm text-[#D32F2F] text-center font-medium">
                      {error}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 text-white font-semibold rounded-[20px] transition-all duration-300 ease-out text-base mt-6 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] shadow-[0_8px_24px_rgba(62,117,255,0.35)] hover:shadow-[0_12px_32px_rgba(62,117,255,0.45)]"
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        className="mr-2.5 h-5 w-5 animate-spin"
                        strokeWidth={2}
                      />
                      Вхід...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2.5 h-5 w-5" strokeWidth={2} />
                      Увійти
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
                <span className="text-xs text-[#B0B0BA] font-light uppercase tracking-widest">
                  або
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-[#8B8B9A] font-light">
                  {footerLinkText}{" "}
                  <a
                    href={footerLinkHref}
                    className="text-[#3e75ff] font-medium hover:text-[#2a5fd4] transition-colors duration-200 hover:underline underline-offset-4"
                  >
                    {footerLinkLabel}
                  </a>
                </p>
                <p className="text-xs text-[#B0B0BA] pt-4 border-t border-stone-200/60 font-light">
                  © 2026 MatchIQ Analytics. Всі права захищені.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
