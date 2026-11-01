import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { LiquidBackdrop } from "@/components/LiquidBackdrop";
import "./NotFound.css";

export default function NotFoundPage() {
  const reducedMotion = Boolean(useReducedMotion());
  useEffect(() => {
    const previous = document.title;
    document.title = "Сторінку не знайдено | MatchIQ";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
    return () => {
      document.title = previous;
      robots.remove();
    };
  }, []);
  return (
    <main className="mq-404">
      <LiquidBackdrop paused={reducedMotion} className="mq-404-liquid" />
      <header className="mq-404-top">
        <Link to="/" className="mq-404-brand" aria-label="MatchIQ — головна">
          <img src="/favicon.svg" width="30" height="30" alt="" /> MatchIQ
        </Link>
      </header>
      <section className="mq-404-card" aria-labelledby="mq-404-title">
        <p className="mq-404-code" aria-hidden="true">
          404
        </p>
        <h1 id="mq-404-title">Такої сторінки немає.</h1>
        <p>
          Можливо, посилання застаріло або в адресі помилка. Повернись на
          головну — там є все про MatchIQ.
        </p>
        <div className="mq-404-actions">
          <Link to="/" className="mq-404-primary">
            На головну <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="mq-404-ghost"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={15} aria-hidden="true" /> Назад
          </button>
        </div>
      </section>
      <footer className="mq-404-bottom">
        © {new Date().getFullYear()} MatchIQ · 18+ · Не приймаємо ставки та не
        зберігаємо кошти.
      </footer>
    </main>
  );
}
