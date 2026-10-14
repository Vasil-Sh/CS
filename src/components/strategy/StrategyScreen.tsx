import type { ReactNode } from "react";
import { Layers, CircleCheck, Plus } from "lucide-react";
import "./StrategyScreen.css";

type Props = {
  total: number;
  primary: boolean;
  query: string;
  activeTab: string;
  onSearch: (value: string) => void;
  onTabChange: (value: string) => void;
  onCreate: () => void;
  children: ReactNode;
};
export default function StrategyScreen(p: Props) {
  return (
    <div
      className={`strategies-screen${p.total === 0 ? " strategies-screen--empty" : ""}`}
    >
      <header className="strategies-hero">
        <div className="strategies-hero-copy">
          <div className="strategies-eyebrow">
            STRATEGIES <span />
          </div>
          <h1>Стратегії</h1>
          <p>Зберігайте правила та оцінюйте їх за результатами ставок.</p>
        </div>
        <button
          className="strategies-create"
          onClick={p.onCreate}
          disabled={p.total >= 25}
        >
          <Plus size={19} />
          Створити стратегію
        </button>
      </header>
      <div className="strategies-summary" aria-label="Статистика стратегій">
        <div>
          <Layers size={25} />
          <span>
            Усі стратегії<strong>{p.total}</strong>
          </span>
        </div>
        <div>
          <CircleCheck size={25} />
          <span>
            Основна<strong>{p.primary ? 1 : 0}</strong>
          </span>
        </div>
      </div>
      <div className="strategies-layout strategies-layout--full">
        {p.children}
      </div>
    </div>
  );
}
