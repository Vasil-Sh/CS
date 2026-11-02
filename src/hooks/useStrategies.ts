import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import { UserDataService } from "@/lib/userDataService";
import type { CS2Strategy } from "@/types/strategy";
import type { Bet } from "@/types/betting";

export const MAX_STRATEGIES = 25;

const keyOf = (s: CS2Strategy) => s.id || s.name;

/** Strategies + journal records for the Strategies screen. */
export function useStrategies() {
  const { user } = useAuth();
  const currentUser = user?.username || localStorage.getItem("username") || "default";
  const bumpStrategy = useAppStore((s) => s.bumpStrategy);

  const [strategies, setStrategies] = useState<CS2Strategy[]>(
    () => UserDataService.getUserData<CS2Strategy[]>(currentUser, "strategies_data", []) || [],
  );
  const [bets, setBets] = useState<Bet[]>(
    () => UserDataService.getUserData<Bet[]>(currentUser, "mybets_data", []) || [],
  );
  const [loading, setLoading] = useState(true);
  const [primaryId, setPrimaryId] = useState<string>(
    () =>
      UserDataService.getUserData<string>(currentUser, "primary_strategy", "") ||
      useAppStore.getState().primaryStrategyId ||
      "",
  );

  const persist = useCallback(
    (list: CS2Strategy[]) => {
      setStrategies(list);
      UserDataService.setUserDataSync(currentUser, "strategies_data", list);
    },
    [currentUser],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await UserDataService.fetchBets();
      setBets((fetched as Bet[]) || []);
    } catch {
      /* keep the cached journal */
    }
    try {
      const api = (await UserDataService.fetchStrategies()) as (Record<string, unknown> & {
        id?: string;
        config?: Record<string, unknown>;
      })[];
      if (api?.length) {
        persist(
          api.map((s) => {
            const cfg = (s.config || {}) as Record<string, unknown>;
            return { ...cfg, id: (cfg.id as string | undefined) || s.id, _backendId: s.id } as unknown as CS2Strategy;
          }),
        );
      }
    } catch {
      /* offline: cached strategies */
    }
    setLoading(false);
  }, [persist]);

  useEffect(() => {
    void load();
  }, [load]);

  const isPrimary = useCallback(
    (s: CS2Strategy) => !!primaryId && (primaryId === keyOf(s) || primaryId === s._backendId || primaryId === s.name),
    [primaryId],
  );

  const setPrimary = useCallback(
    (s: CS2Strategy | null, silent = false) => {
      const id = s ? keyOf(s) : "";
      setPrimaryId(id);
      UserDataService.setUserDataSync(currentUser, "primary_strategy", id);
      useAppStore.getState().setPrimaryStrategyId(id);
      if (s?._backendId) UserDataService.setPrimaryStrategy(s._backendId).catch(() => {});
      if (!silent) toast.success(s ? `«${s.name}» — основна стратегія` : "Основну стратегію скасовано");
      bumpStrategy();
    },
    [currentUser, bumpStrategy],
  );

  const togglePrimary = (s: CS2Strategy) => setPrimary(isPrimary(s) ? null : s);

  const nameTaken = (name: string, except?: CS2Strategy) =>
    strategies.some(
      (s) => s !== except && s.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
    );

  /** Throws with a user-facing message; the dialog keeps itself open on error. */
  const create = async (strat: CS2Strategy, makePrimary: boolean) => {
    if (strategies.length >= MAX_STRATEGIES) throw new Error(`Максимум ${MAX_STRATEGIES} стратегій.`);
    if (nameTaken(strat.name)) throw new Error("Стратегія з такою назвою вже існує.");
    const created = await UserDataService.createStrategy({ name: strat.name, isPrimary: makePrimary, config: strat });
    const saved: CS2Strategy = { ...strat, _backendId: typeof created?.id === "string" ? created.id : undefined };
    persist([...strategies, saved]);
    if (makePrimary) setPrimary(saved, true);
    bumpStrategy();
    toast.success(`Стратегію «${saved.name}» створено`);
    return saved;
  };

  const update = async (strat: CS2Strategy, prev: CS2Strategy, makePrimary: boolean) => {
    if (nameTaken(strat.name, prev)) throw new Error("Стратегія з такою назвою вже існує.");
    const backendId = prev._backendId;
    if (!backendId) throw new Error("Стратегія ще синхронізується. Спробуйте за хвилину.");
    await UserDataService.updateStrategy(backendId, { name: strat.name, config: strat });
    const saved = { ...strat, _backendId: backendId };
    persist(strategies.map((s) => (s === prev ? saved : s)));
    if (makePrimary && !isPrimary(prev)) setPrimary(saved, true);
    else if (!makePrimary && isPrimary(prev)) setPrimary(null, true);
    else if (isPrimary(prev)) setPrimaryId(keyOf(saved));
    bumpStrategy();
    toast.success("Зміни збережено");
    return saved;
  };

  const remove = (s: CS2Strategy) => {
    persist(strategies.filter((x) => x !== s));
    if (isPrimary(s)) setPrimary(null, true);
    bumpStrategy();
    toast.success("Стратегію видалено");
    UserDataService.deleteStrategy(s._backendId || keyOf(s), s.name).catch(() => {
      toast.error("Не вдалося видалити на сервері. Спробуйте ще раз пізніше.");
    });
  };

  return { strategies, bets, loading, isPrimary, togglePrimary, create, update, remove, reload: load };
}
