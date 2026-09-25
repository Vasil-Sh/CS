import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useLogin";
import { ArrowLeft, ArrowRight, Loader2, Lock, User } from "lucide-react";
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

  const eyebrow = demo ? "DEMO ACCESS" : "MATCHIQ / ВХІД";
  const heading = demo ? "Увійди в демо." : "Повернись до своїх даних.";
  const subText = demo
    ? "Переглянь можливості MatchIQ у демонстраційному середовищі."
    : "Твоя історія ставок, аналітика та правила — поруч.";
  const footerLinkText = demo ? "Не демо?" : "Потрібна допомога?";
  const footerLinkHref = demo ? "/login" : "#";
  const footerLinkLabel = demo
    ? "Повна версія входу"
    : "Зв'яжіться з підтримкою";

  return (
    <>
      <SEO title={seoTitle} description={seoDesc} canonical={seoCanonical} />
      <main className="min-h-screen overflow-hidden bg-[#111110] text-[#f4f1e9] lg:grid lg:grid-cols-[minmax(0,47%)_minmax(0,53%)]">
        <section className="relative flex min-h-screen flex-col border-b border-white/15 px-6 py-7 sm:px-10 lg:border-b-0 lg:border-r lg:px-[clamp(2.5rem,5vw,6.75rem)] lg:py-11">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,105,55,0.1),transparent_28%),linear-gradient(115deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:auto,28px_28px] opacity-60" />
          <header className="relative flex items-center justify-between border-b border-white/20 pb-6 lg:pb-8">
            <Link
              to="/"
              aria-label="MatchIQ — на головну"
              className="text-[1.75rem] font-semibold tracking-[-0.08em] text-[#f4f1e9] transition-colors hover:text-[#ff6937]"
            >
              Match<span className="text-[#ff6937]">IQ</span>
            </Link>
            <span className="hidden text-[10px] uppercase tracking-[0.24em] text-white/45 sm:block">
              CS2 / Dota 2 / Аналітика
            </span>
          </header>

          <div className="relative flex flex-1 flex-col justify-center py-14 sm:py-20">
            <Link
              to="/"
              className="mb-10 inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.13em] text-white/65 transition-colors hover:text-[#ff6937]"
            >
              <ArrowLeft className="h-4 w-4" /> На головну
            </Link>
            <div className="max-w-xl">
              <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.25em] text-[#ff6937]">
                {eyebrow}
              </p>
              <h1 className="max-w-md text-[clamp(3.35rem,6.2vw,6.1rem)] font-semibold leading-[0.86] tracking-[-0.075em] text-[#f4f1e9]">
                {heading}
              </h1>
              <p className="mt-7 max-w-sm text-base leading-relaxed text-white/65 sm:text-lg">
                {subText}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-12 max-w-lg space-y-7">
              <div className="space-y-3">
                <Label
                  htmlFor="username"
                  className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-white/75"
                >
                  <User className="h-3.5 w-3.5 text-[#ff6937]" /> Ім&apos;я
                  користувача
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Введіть ім'я користувача"
                  required
                  disabled={isLoading}
                  className="h-14 rounded-none border-x-0 border-t-0 border-b border-white/30 bg-transparent px-0 text-base text-[#f4f1e9] placeholder:text-white/30 transition-colors hover:border-white/60 focus-visible:border-[#ff6937] focus-visible:ring-0 disabled:opacity-50"
                />
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-white/75"
                >
                  <Lock className="h-3.5 w-3.5 text-[#ff6937]" /> Пароль
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Введіть пароль"
                  required
                  disabled={isLoading}
                  className="h-14 rounded-none border-x-0 border-t-0 border-b border-white/30 bg-transparent px-0 text-base text-[#f4f1e9] placeholder:text-white/30 transition-colors hover:border-white/60 focus-visible:border-[#ff6937] focus-visible:ring-0 disabled:opacity-50"
                />
              </div>
              {error && (
                <div
                  role="alert"
                  className="border-l-2 border-[#ff6937] bg-[#ff6937]/10 px-4 py-3 text-sm text-[#ffd7ca]"
                >
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="group mt-3 h-14 w-full rounded-none bg-[#ff6937] px-6 text-base font-semibold text-[#111110] shadow-none transition-[background-color,transform] duration-200 hover:translate-x-1 hover:bg-[#ff835c] focus-visible:ring-[#ff6937] active:translate-x-0 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Вхід...
                  </>
                ) : (
                  <>
                    Увійти{" "}
                    <ArrowRight className="ml-auto h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <footer className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-6 text-xs text-white/45">
            <p>
              {footerLinkText}{" "}
              <a
                href={footerLinkHref}
                className="text-[#ff9a7d] underline decoration-[#ff6937]/60 underline-offset-4 transition-colors hover:text-white"
              >
                {footerLinkLabel}
              </a>
            </p>
            <p>© 2026 MatchIQ</p>
          </footer>
        </section>

        <aside
          className="relative hidden min-h-screen overflow-hidden lg:block"
          aria-hidden="true"
        >
          <img
            src="/assets/landing-arena.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-right grayscale"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,16,0.5),transparent_38%,rgba(17,17,16,0.08))]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-10 text-[10px] uppercase tracking-[0.24em] text-white/60">
            <span>Більше даних</span>
            <span>Кращі рішення</span>
          </div>
          <div className="absolute bottom-10 left-10 max-w-[14rem] border-l-2 border-[#ff6937] pl-5 text-xs uppercase leading-relaxed tracking-[0.19em] text-white/75">
            Твоя гра.
            <br />
            Твої дані.
            <br />
            Твій аналіз.
          </div>
          <div className="absolute inset-y-0 right-0 flex w-[5.5rem] items-center justify-center bg-[#ff6937] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111110] [writing-mode:vertical-rl]">
            Більше контексту. Більше контролю.
          </div>
        </aside>
      </main>
    </>
  );
}
