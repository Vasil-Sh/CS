import { Link, useLocation } from "react-router-dom";
import StrategyOverview from "@/components/StrategyOverview";
import GoalsManager from "@/components/GoalsManager";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./StrategyWorkspace.css";

export default function StrategyWorkspace() {
  const goals = useLocation().pathname === "/app/goals";
  if (goals) return <div className="strategy-workspace"><ErrorBoundary><GoalsManager focusLayout /></ErrorBoundary></div>;
  return (
    <div className="strategy-workspace">
      <header className="sw-header">
        <span className="sw-eyebrow">Стратегії та цілі</span>
        <h1>{goals ? "Цілі" : "Стратегії"}</h1>
        <p>
          {goals
            ? "Відстежуйте прогрес, обирайте основну ціль та переглядайте результати."
            : "Зберігайте правила, обирайте основну стратегію та оцінюйте її за своїми ставками."}
        </p>
        <nav aria-label="Стратегії та цілі" className="sw-routes">
          <Link to="/app/strategy" aria-current={!goals ? "page" : undefined}>
            Стратегії
          </Link>
          <Link to="/app/goals" aria-current={goals ? "page" : undefined}>
            Цілі
          </Link>
        </nav>
      </header>
      <div className="sw-content">
        <ErrorBoundary key={goals ? "goals" : "strategies"}>
          {goals ? <GoalsManager /> : <StrategyOverview />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
