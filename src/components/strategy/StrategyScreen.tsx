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
const steps = [
  [
    "Запишіть правила",
    "Вкажіть умови, за якими ви робите ставки. Це можуть бути коефіцієнти, ринки та формати матчів.",
  ],
  [
    "Прив’язуйте ставки",
    "Додавайте зроблені ставки до відповідної стратегії, щоб відстежувати результати.",
  ],
  [
    "Порівнюйте результати",
    "Аналізуйте прибуток, відсоток перемог та інші показники, щоб покращувати свої стратегії.",
  ],
];
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
      <div
        className={`strategies-layout${p.total === 0 ? "" : " strategies-layout--full"}`}
      >
        {p.total === 0 && p.activeTab === "overview" ? (
          <div className="strategies-empty">
            <Layers size={54} strokeWidth={1.6} />
            <h3>Ще немає стратегій</h3>
            <p>Створіть першу стратегію для аналізу результатів.</p>
            <button className="strategies-create" onClick={p.onCreate}>
              <Plus size={19} />
              Створити стратегію
            </button>
          </div>
        ) : (
          p.children
        )}
        {p.total === 0 && (
          <aside className="strategies-help">
            <h2>Як це працює?</h2>
            <ol>
              {steps.map(([title, description], i) => (
                <li key={title}>
                  <span className="strategies-step">{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
