import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useLogin } from "@/hooks/useLogin";
import { SEO } from "@/components/SEO";
import "./LoginPage.css";

interface LoginPageProps {
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
  const [showPassword, setShowPassword] = useState(false);
  return (
    <main className="mq-auth">
      <SEO
        title={demo ? "Демо — Увійти" : "Увійти"}
        description="Увійди до MatchIQ — трекера ставок на CS2 та Dota 2. Журнал, аналітика, банкрол і власні правила."
        canonical={
          demo
            ? "https://matchiq.pro/login-digesto-demo"
            : "https://matchiq.pro/login"
        }
      />
      <section className="mq-auth-form-panel" aria-labelledby="mq-auth-title">
        <header className="mq-auth-header">
          <Link
            className="mq-auth-brand"
            to="/"
            aria-label="MatchIQ — на головну"
          >
            <img src="/favicon.svg" alt="" width="32" height="32" />
            MatchIQ
          </Link>
          <Link className="mq-auth-back" to="/">
            <ArrowLeft size={15} aria-hidden="true" /> На головну
          </Link>
        </header>
        <div className="mq-auth-form-wrap">
          <p className="mq-auth-eyebrow">
            <span /> {demo ? "ДЕМО MATCHIQ" : "ТВІЙ ПРОСТІР MATCHIQ"}
          </p>
          <h1 id="mq-auth-title">
            {demo ? "Зазирни всередину." : "З поверненням."}
          </h1>
          <p className="mq-auth-description">
            {demo
              ? "Введи логін і пароль демо-облікового запису, щоб переглянути застосунок."
              : "Увійди, щоб продовжити вести журнал ставок і стежити за своїми результатами."}
          </p>
          <form
            onSubmit={handleSubmit}
            aria-label="Вхід до MatchIQ"
            aria-busy={isLoading}
          >
            <div className="mq-auth-field">
              <label htmlFor="username">Ім’я користувача</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Твій логін"
                required
                disabled={isLoading}
                aria-describedby={error ? "mq-auth-error" : undefined}
              />
            </div>
            <div className="mq-auth-field">
              <label htmlFor="password">Пароль</label>
              <div className="mq-auth-password">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Введи пароль"
                  required
                  disabled={isLoading}
                  aria-describedby={error ? "mq-auth-error" : undefined}
                />
                <button
                  type="button"
                  className="mq-auth-eye"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Приховати пароль" : "Показати пароль"
                  }
                  aria-pressed={showPassword}
                  aria-controls="password"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="mq-auth-error" id="mq-auth-error" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <button
              className="mq-auth-submit"
              type="submit"
              disabled={isLoading}
            >
              <span>
                {isLoading ? "Входимо…" : demo ? "Увійти в демо" : "Увійти"}
              </span>
              <span className="mq-auth-submit-icon" aria-hidden="true">
                {isLoading ? (
                  <Loader2 className="mq-auth-spinner" size={18} />
                ) : (
                  <ArrowUpRight size={18} />
                )}
              </span>
            </button>
            <p className="mq-auth-status" role="status">
              {isLoading ? "Перевіряємо дані входу…" : ""}
            </p>
          </form>
          <div className="mq-auth-help">
            <span>
              {demo ? "Немає демодоступу?" : "Хочеш спочатку ознайомитися?"}
            </span>
            <Link to="/#possibilities">
              Переглянути приклади <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {demo && (
            <Link className="mq-auth-regular" to="/login">
              Вхід у власний акаунт
            </Link>
          )}
        </div>
        <footer className="mq-auth-footer">
          <span>© {new Date().getFullYear()} MatchIQ</span>
          <span>CS2 / DOTA 2</span>
        </footer>
      </section>
      <aside className="mq-auth-story" aria-labelledby="mq-auth-story-title">
        <div className="mq-auth-story-top">
          <span>ОБЛІК. АНАЛІЗ. ДИСЦИПЛІНА.</span>
          <span>01 — 03</span>
        </div>
        <div className="mq-auth-story-content">
          <div className="mq-auth-story-heading">
            <div>
              <p className="mq-auth-eyebrow">ТРЕКЕР СТАВОК НА КІБЕРСПОРТ</p>
              <h2 id="mq-auth-story-title">
                Кожен запис.
                <br />
                Більше <span>розуміння.</span>
              </h2>
            </div>
          </div>
          <p>
            Зберігай не лише результат, а й причину рішення. Повертайся до
            фактів, коли емоції минуть.
          </p>
          <ol className="mq-auth-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Веди журнал</h3>
                <p>Суми, коефіцієнти, результати та нотатки.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Розумій свої результати</h3>
                <p>Банкрол, прибуток і збитки, порівняння стратегій.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Дотримуйся власних правил</h3>
                <p>Цілі, перевірки стратегії та ризиковані команди.</p>
              </div>
            </li>
          </ol>
        </div>
        <div className="mq-auth-story-bottom">
          MatchIQ не приймає ставки та не зберігає кошти.
        </div>
        <span className="mq-auth-watermark" aria-hidden="true">
          MatchIQ
        </span>
      </aside>
    </main>
  );
}
