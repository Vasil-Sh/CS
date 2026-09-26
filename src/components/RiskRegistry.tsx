import { useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Trash2,
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
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name, "uk")
            : (order[a.status] ?? 99) - (order[b.status] ?? 99) ||
              a.name.localeCompare(b.name, "uk"),
        ),
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
  const reset = () => {
    setGame("all");
    setStatus("all");
    h.setSearchQuery("");
  };

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
            <span className="sr-only">Знайти команду або правило</span>
            <input
              value={h.searchQuery}
              onChange={(event) => h.setSearchQuery(event.target.value)}
              placeholder="Знайти команду або правило…"
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
            className="risk-filter"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((value) => !value)}
          >
            <SlidersHorizontal size={17} /> Фільтри <ChevronDown size={16} />
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
                  <option value="name">за назвою</option>
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
                      const editing = h.editingIndex === index;
                      return editing ? (
                        <tr className="risk-edit" key={`${team.name}-${index}`}>
                          <td colSpan={5}>
                            <div className="risk-editor">
                              <Input
                                value={h.editName}
                                onChange={(event) =>
                                  h.setEditName(event.target.value)
                                }
                                aria-label="Назва команди"
                              />
                              <select
                                value={h.editGame}
                                onChange={(event) =>
                                  h.setEditGame(event.target.value)
                                }
                                aria-label="Гра"
                              >
                                <option value="CS">CS</option>
                                <option value="Дота">Dota 2</option>
                              </select>
                              <select
                                value={h.editStatus}
                                onChange={(event) =>
                                  h.setEditStatus(event.target.value)
                                }
                                aria-label="Статус"
                              >
                                {ALL_STATUSES.map((item) => (
                                  <option key={item}>{item}</option>
                                ))}
                              </select>
                              <Textarea
                                value={h.editNotes}
                                onChange={(event) =>
                                  h.setEditNotes(event.target.value)
                                }
                                aria-label="Коментар"
                                rows={2}
                              />
                              <div>
                                <button type="button" onClick={h.cancelEditing}>
                                  Скасувати
                                </button>
                                <button
                                  type="button"
                                  className="risk-primary"
                                  disabled={!h.editName.trim()}
                                  onClick={h.saveEditing}
                                >
                                  Зберегти
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
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
                <button type="button" onClick={reset}>
                  Скинути фільтри
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
            </ol>
          </aside>
        </div>
      </div>
      <Dialog open={h.isAddTeamOpen} onOpenChange={h.setIsAddTeamOpen}>
        <DialogContent className="risk-dialog">
          <DialogHeader>
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
          <DialogFooter>
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
          <DialogHeader>
            <DialogTitle>Видалити команду?</DialogTitle>
            <DialogDescription>
              Команду{" "}
              <strong>
                {deleteTarget !== null ? h.riskyTeams[deleteTarget]?.name : ""}
              </strong>{" "}
              буде видалено з реєстру. Цю дію неможливо скасувати.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
      <Dialog open={h.isSheetsGuideOpen} onOpenChange={h.setIsSheetsGuideOpen}>
        <DialogContent className="risk-dialog">
          <DialogHeader>
            <DialogTitle>Імпорт із Google Sheets</DialogTitle>
            <DialogDescription>
              Під час імпорту список команд замінюється даними з таблиці.
            </DialogDescription>
          </DialogHeader>
          <div className="risk-dialog-fields">
            <Input
              value={h.customSheetUrl}
              onChange={(event) => h.setCustomSheetUrl(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
            />
            <p>
              Колонки: назва команди, статус і нотатка. Таблиця має бути
              доступна для читання за посиланням.
            </p>
          </div>
          <DialogFooter>
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
                "Завантаження…"
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
