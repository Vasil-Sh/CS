import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ALL_STATUSES, useRiskyTeams } from "@/hooks/useRiskyTeams";
import "./RiskRegistry.css";
import { proxyLogoUrl } from "@/lib/logoProxy";

type Game = "all" | "CS" | "Дота";
const order: Record<string, number> = {
  БАН: 0,
  Ризиковані: 1,
  Нестабільні: 2,
  Обережно: 3,
  "Під питанням": 4,
  Неоцінена: 5,
  Стабільні: 6,
  Надійна: 7,
};
const tone = (value: string) => {
  switch (value) {
    case "БАН":
      return "ban";
    case "Ризиковані":
      return "warning";
    case "Нестабільні":
      return "unstable";
    case "Обережно":
      return "caution";
    case "Під питанням":
      return "question";
    case "Неоцінена":
      return "neutral";
    case "Стабільні":
      return "safe";
    case "Надійна":
      return "reliable";
    default:
      return "neutral";
  }
};

export default function RiskRegistry() {
  const h = useRiskyTeams();
  const [game, setGame] = useState<Game>("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("risk");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const counts = useMemo(() => {
    const output: Record<string, number> = { all: h.riskyTeams.length };
    ALL_STATUSES.forEach((item) => {
      output[item] = h.riskyTeams.filter((team) => team.status === item).length;
    });
    return output;
  }, [h.riskyTeams]);
  const rows = useMemo(
    () =>
      h.riskyTeams
        .filter((team) => {
          const query = h.searchQuery.toLowerCase().trim();
          return (
            (game === "all" || team.game === game) &&
            (status === "all" || team.status === status) &&
            (!query ||
              [team.name, team.game, team.status, team.notes].some((item) =>
                item.toLowerCase().includes(query),
              ))
          );
        })
        .sort((a, b) => {
          switch (sort) {
            case "name":
              return a.name.localeCompare(b.name, "uk");
            case "name-desc":
              return b.name.localeCompare(a.name, "uk");
            case "game":
              return (
                (a.game === "CS" ? 0 : 1) - (b.game === "CS" ? 0 : 1) ||
                a.name.localeCompare(b.name, "uk")
              );
            case "game-dota":
              return (
                (a.game === "Дота" ? 0 : 1) - (b.game === "Дота" ? 0 : 1) ||
                a.name.localeCompare(b.name, "uk")
              );
            case "risk":
            default:
              return (
                (order[a.status] ?? 99) - (order[b.status] ?? 99) ||
                a.name.localeCompare(b.name, "uk")
              );
          }
        }),
    [game, h.riskyTeams, h.searchQuery, sort, status],
  );
  const chips = [
    "БАН",
    "Ризиковані",
    "Нестабільні",
    "Обережно",
    "Під питанням",
    "Стабільні",
    "Надійна",
    "Неоцінена",
  ];

  return (
    <div className="risk-registry">
      <section className="risk-hero" aria-labelledby="risk-title">
        <div className="risk-hero-top">
          <div>
            <h1 id="risk-title">Ризиковані команди</h1>
            <p>Правила, які допомагають не пропустити ризик перед ставкою.</p>
          </div>
          <div className="risk-actions">
            <button
              className="risk-button risk-secondary"
              onClick={() => h.setIsSheetsGuideOpen(true)}
            >
              <FileSpreadsheet size={17} /> Імпорт із Google Sheets
            </button>
            <button
              className="risk-button risk-primary"
              onClick={() => h.setIsAddTeamOpen(true)}
            >
              <Plus size={18} /> Додати команду
            </button>
          </div>
        </div>
        <dl className="risk-metrics">
          <div>
            <dt>Усі команди</dt>
            <dd>{h.teamStats.total}</dd>
          </div>
          <div className="is-ban">
            <dt>БАН</dt>
            <dd>{h.teamStats.banCount}</dd>
          </div>
          <div className="is-warning">
            <dt>Ризиковані</dt>
            <dd>{h.teamStats.unstableCount}</dd>
          </div>
          <div>
            <dt>Неоцінені</dt>
            <dd>{h.teamStats.noStatusCount}</dd>
          </div>
        </dl>
      </section>
      <div className="risk-workspace">
        <div className="risk-toolbar">
          <label className="risk-search">
            <Search size={18} />
            <span className="sr-only">Знайти команду або коментар</span>
            <input
              value={h.searchQuery}
              onChange={(event) => h.setSearchQuery(event.target.value)}
              placeholder="Знайти команду або коментар…"
            />
          </label>
          <div className="risk-games" role="group" aria-label="Фільтр за грою">
            {[
              ["all", "Усі", h.teamStats.total],
              ["CS", "CS", h.teamStats.csCount],
              ["Дота", "Dota 2", h.teamStats.dotaCount],
            ].map(([key, name, total]) => (
              <button
                key={key}
                type="button"
                aria-pressed={game === key}
                onClick={() => setGame(key as Game)}
              >
                {name}
                <span>{total}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`risk-filter${status !== "all" ? " risk-filter-active" : ""}`}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((value) => !value)}
          >
            <SlidersHorizontal size={17} /> Фільтри{" "}
            {status !== "all" && (
              <span className="risk-filter-count">1</span>
            )}
            {filtersOpen ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronUp size={16} />
            )}
          </button>
        </div>
        {filtersOpen && (
          <div
            className="risk-chips"
            role="group"
            aria-label="Фільтр за статусом"
          >
            <button
              type="button"
              aria-pressed={status === "all"}
              onClick={() => setStatus("all")}
            >
              Усі
            </button>
            {chips.map((item) => (
              <button
                type="button"
                key={item}
                className={tone(item)}
                aria-pressed={status === item}
                onClick={() => setStatus(status === item ? "all" : item)}
              >
                {item === "Неоцінена" ? "Неоцінені" : item}{" "}
                <span>{counts[item] ?? 0}</span>
              </button>
            ))}
          </div>
        )}
        <div className="risk-grid">
          <section
            className="risk-table-panel"
            aria-labelledby="risk-list-title"
          >
            <header className="risk-list-head">
              <div>
                <h2 id="risk-list-title">Команди, що потребують уваги</h2>
                <p>
                  {rows.length} з {h.riskyTeams.length} записів
                </p>
              </div>
              <label>
                Сортування:{" "}
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="risk">найвищий ризик</option>
                  <option value="name">за назвою (А–Я)</option>
                  <option value="name-desc">за назвою (Я–А)</option>
                  <option value="game">за грою (CS спочатку)</option>
                  <option value="game-dota">за грою (Dota 2 спочатку)</option>
                </select>
              </label>
            </header>
            {h.isLoadingTeams ? (
              <div className="risk-empty">Завантажуємо реєстр…</div>
            ) : rows.length ? (
              <div className="risk-scroll">
                <table>
                  <caption className="sr-only">
                    Реєстр ризикованих команд
                  </caption>
                  <thead>
                    <tr>
                      <th>Команда</th>
                      <th>Гра</th>
                      <th>Статус</th>
                      <th>Коментар</th>
                      <th>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((team) => {
                      const index = h.riskyTeams.indexOf(team);
                      return (
                        <tr key={`${team.name}-${index}`}>
                          <td className="risk-team">
                            <div className="risk-team-identity">
                              <span
                                className="risk-team-logo"
                                aria-hidden="true"
                              >
                                <span>
                                  {team.name.slice(0, 2).toUpperCase()}
                                </span>
                                {team.logo && (
                                  <img
                                    src={
                                      proxyLogoUrl(team.logo, team.game) ||
                                      undefined
                                    }
                                    alt=""
                                    onError={(event) => {
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                )}
                              </span>
                              <strong>{team.name}</strong>
                            </div>
                          </td>
                          <td>{team.game === "Дота" ? "Dota 2" : "CS"}</td>
                          <td>
                            <span
                              className={`risk-status ${tone(team.status)}`}
                            >
                              {team.status || "Неоцінена"}
                            </span>
                          </td>
                          <td className="risk-rule">
                            <span>{team.notes || "Нотатку ще не додано"}</span>
                          </td>
                          <td>
                            <div className="risk-row-actions">
                              <button
                                type="button"
                                aria-label={`Редагувати ${team.name}`}
                                title="Редагувати"
                                onClick={() => h.startEditing(index, team)}
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Видалити ${team.name}`}
                                title="Видалити команду"
                                className="risk-remove"
                                onClick={() => setDeleteTarget(index)}
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="risk-empty">
                <strong>Нічого не знайдено</strong>
                <p>Змініть фільтри або спробуйте інший запит.</p>
                <button
                  type="button"
                  className="risk-button risk-primary"
                  onClick={() => h.setIsAddTeamOpen(true)}
                >
                  <Plus size={17} /> Додати команду
                </button>
              </div>
            )}
          </section>
          <aside className="risk-guide" aria-labelledby="risk-guide-title">
            <h2 id="risk-guide-title">Як читати статус</h2>
            <ol>
              <li>
                <span>1</span>
                <div>
                  <strong>БАН</strong>
                  <p>Не розглядати для ставки.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Ризиковані</strong>
                  <p>Високий ризик — ставити обережно.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Нестабільні</strong>
                  <p>Лише за конкретним сценарієм.</p>
                </div>
              </li>
              {guideOpen && (
                <>
              <li>
                <span>4</span>
                <div>
                  <strong>Обережно</strong>
                  <p>Зверніть увагу на форму команди.</p>
                </div>
              </li>
              <li>
                <span>5</span>
                <div>
                  <strong>Під питанням</strong>
                  <p>Перевірити актуальну форму.</p>
                </div>
              </li>
              <li>
                <span>6</span>
                <div>
                  <strong>Стабільні</strong>
                  <p>Передбачуваний результат.</p>
                </div>
              </li>
              <li>
                <span>7</span>
                <div>
                  <strong>Надійна</strong>
                  <p>Доведена позитивна динаміка.</p>
                </div>
              </li>
              <li>
                <span>8</span>
                <div>
                  <strong>Неоцінена</strong>
                  <p>Недостатньо даних для оцінки.</p>
                </div>
              </li>
                </>
              )}
            </ol>
            <button
              type="button"
              className="risk-guide-toggle"
              aria-expanded={guideOpen}
              onClick={() => setGuideOpen((v) => !v)}
            >
              <ChevronDown size={16} />
              {guideOpen ? "Згорнути" : "Показати всі статуси"}
            </button>
          </aside>
        </div>
      </div>
      <Dialog open={h.isAddTeamOpen} onOpenChange={h.setIsAddTeamOpen}>
        <DialogContent className="risk-dialog">
          <DialogHeader className="risk-dialog-header">
            <DialogTitle>Додати команду</DialogTitle>
            <DialogDescription>
              Додайте команду, яку треба відстежувати перед ставкою.
            </DialogDescription>
          </DialogHeader>
          <div className="risk-dialog-fields">
            <Input
              placeholder="Назва команди"
              value={h.newTeam.name}
              onChange={(event) =>
                h.setNewTeam({ ...h.newTeam, name: event.target.value })
              }
            />
            <select
              value={h.newTeam.game}
              onChange={(event) =>
                h.setNewTeam({ ...h.newTeam, game: event.target.value })
              }
            >
              <option value="CS">CS</option>
              <option value="Дота">Dota 2</option>
            </select>
            <div className="risk-status-field">
              <span
                className={`risk-status-dot ${tone(h.newTeam.status)}`}
                aria-hidden="true"
              />
              <select
                value={h.newTeam.status}
                onChange={(event) =>
                  h.setNewTeam({ ...h.newTeam, status: event.target.value })
                }
              >
                {ALL_STATUSES.map((item, index) => (
                  <option key={item} value={item}>
                    {index + 1}. {item}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              placeholder="Коментар або коротка нотатка"
              value={h.newTeam.notes}
              onChange={(event) =>
                h.setNewTeam({ ...h.newTeam, notes: event.target.value })
              }
              rows={4}
            />
          </div>
          <DialogFooter className="risk-dialog-footer">
            <button
              className="risk-button risk-secondary"
              onClick={() => h.setIsAddTeamOpen(false)}
            >
              Скасувати
            </button>
            <button
              className="risk-button risk-primary"
              disabled={!h.newTeam.name.trim()}
              onClick={() => {
                h.addRiskyTeam();
                h.setIsAddTeamOpen(false);
              }}
            >
              Додати
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="risk-dialog">
          <DialogHeader className="risk-dialog-header">
            <div className="flex items-center gap-3">
              <div className="risk-dialog-icon risk-dialog-icon-danger">
                <Trash2 size={20} />
              </div>
              <DialogTitle>Видалити команду?</DialogTitle>
            </div>
          </DialogHeader>
          <div className="risk-dialog-body">
            <div className="risk-dialog-name">
              {deleteTarget !== null ? h.riskyTeams[deleteTarget]?.name : ""}
            </div>
            <div className="risk-dialog-warning">
              <AlertTriangle size={18} className="shrink-0 text-red-600" />
              <p>Команду буде видалено з реєстру. Цю дію неможливо скасувати.</p>
            </div>
          </div>
          <DialogFooter className="risk-dialog-footer">
            <button
              className="risk-button risk-secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Скасувати
            </button>
            <button
              className="risk-button risk-danger"
              onClick={() => {
                if (deleteTarget !== null) h.deleteRiskyTeam(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              <Trash2 size={16} /> Видалити
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit team dialog */}
      <Dialog
        open={h.editingIndex !== null}
        onOpenChange={(open) => !open && h.cancelEditing()}
      >
        <DialogContent className="risk-dialog">
          <DialogHeader className="risk-dialog-header">
            <DialogTitle>Редагувати команду</DialogTitle>
            <DialogDescription>
              Оновіть дані команди, яку відстежуєте перед ставкою.
            </DialogDescription>
          </DialogHeader>
          <div className="risk-dialog-fields">
            <Input
              value={h.editName}
              onChange={(event) => h.setEditName(event.target.value)}
              placeholder="Назва команди"
            />
            <select
              value={h.editGame}
              onChange={(event) => h.setEditGame(event.target.value)}
            >
              <option value="CS">CS</option>
              <option value="Дота">Dota 2</option>
            </select>
            <div className="risk-status-field">
              <span
                className={`risk-status-dot ${tone(h.editStatus)}`}
                aria-hidden="true"
              />
              <select
                value={h.editStatus}
                onChange={(event) => h.setEditStatus(event.target.value)}
              >
                {ALL_STATUSES.map((item, index) => (
                  <option key={item} value={item}>
                    {index + 1}. {item}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              value={h.editNotes}
              onChange={(event) => h.setEditNotes(event.target.value)}
              placeholder="Коментар або коротка нотатка"
              rows={3}
            />
          </div>
          <DialogFooter className="risk-dialog-footer">
            <button
              className="risk-button risk-secondary"
              onClick={h.cancelEditing}
            >
              Скасувати
            </button>
            <button
              className="risk-button risk-primary"
              disabled={!h.editName.trim()}
              onClick={h.saveEditing}
            >
              Зберегти
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={h.isSheetsGuideOpen} onOpenChange={h.setIsSheetsGuideOpen}>
        <DialogContent className="risk-dialog risk-sheets-dialog">
          <DialogHeader className="risk-dialog-header">
            <DialogTitle>Імпорт із Google Sheets</DialogTitle>
            <DialogDescription>
              Як оформити документ, щоб дані правильно підтягнулись.
            </DialogDescription>
          </DialogHeader>
          <div className="risk-sheets-body">
            {/* Крок 1 */}
            <div className="risk-sheet-step">
              <span className="risk-sheet-step-num">1</span>
              <div>
                <h4>Створіть Google Sheets документ</h4>
                <p>
                  Відкрийте новий документ на{" "}
                  <strong>Google Sheets</strong> і дайте йому будь-яку назву.
                </p>
              </div>
            </div>

            {/* Крок 2 */}
            <div className="risk-sheet-step">
              <span className="risk-sheet-step-num">2</span>
              <div>
                <h4>Оформіть колонки</h4>
                <div className="risk-sheet-table">
                  <table>
                    <thead>
                      <tr>
                        <th>A — Назва команди</th>
                        <th>B — Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Vitality</td>
                        <td>🟩 CS: У фіналах часто вимикаються…</td>
                      </tr>
                      <tr>
                        <td>Team Spirit</td>
                        <td>🟨 Dota2: Тільки на +1.5</td>
                      </tr>
                      <tr>
                        <td>Virtus Pro</td>
                        <td>🟥 CS: Раки — рідко на них ставити</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="risk-sheet-note">
                  💡 Перший рядок може бути заголовком — він буде автоматично
                  проігнорований.
                </p>
              </div>
            </div>

            {/* Крок 3 */}
            <div className="risk-sheet-step">
              <span className="risk-sheet-step-num">3</span>
              <div>
                <h4>Відкрийте доступ до документу</h4>
                <p>
                  Натисніть{" "}
                  <strong>«Поділитися» → «Усі, хто має посилання» → «Читач»</strong>
                  , щоб документ був доступний для читання.
                </p>
              </div>
            </div>

            {/* Крок 4 */}
            <div className="risk-sheet-step">
              <span className="risk-sheet-step-num">4</span>
              <div>
                <h4>Вставте посилання на ваш документ</h4>
                <Input
                  value={h.customSheetUrl}
                  onChange={(event) => h.setCustomSheetUrl(event.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/ВАШ_ID/edit"
                />
                {h.customSheetUrl.trim() &&
                  !h.customSheetUrl.trim().includes("spreadsheets/d/") && (
                    <p className="risk-sheet-error">
                      ❌ Неправильний формат посилання. Перевірте, чи скопійовано
                      повне посилання з Google Sheets.
                    </p>
                  )}
                {h.customSheetUrl.trim() &&
                  h.customSheetUrl.trim().includes("spreadsheets/d/") && (
                    <p className="risk-sheet-ok">
                      ✓ Посилання правильне. Будуть завантажені команди з вашого
                      документу.
                    </p>
                  )}
              </div>
            </div>

            {/* Попередження */}
            <div className="risk-sheet-warning">
              <AlertTriangle size={16} className="shrink-0 text-red-600" />
              <p>
                <strong>Важливо:</strong> при оновленні всі команди замінюються
                даними з Google Sheets. Локальні зміни будуть перезаписані.
              </p>
            </div>
          </div>
          <DialogFooter className="risk-dialog-footer">
            <button
              className="risk-button risk-secondary"
              onClick={() => h.setIsSheetsGuideOpen(false)}
            >
              Скасувати
            </button>
            <button
              className="risk-button risk-primary"
              disabled={h.isUpdating}
              onClick={() => {
                h.updateFromGoogleSheets();
                h.setIsSheetsGuideOpen(false);
              }}
            >
              {h.isUpdating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Завантаження…
                </>
              ) : (
                <>
                  <Download size={16} /> Оновити список
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
