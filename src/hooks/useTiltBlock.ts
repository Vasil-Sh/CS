// ═══════════════════════════════════════════
// useTiltBlock — extracted tilt protection hook
// Previously duplicated in CS2BettingForm (~110 lines)
// ═══════════════════════════════════════════

import { useState, useEffect, useMemo, useRef } from "react";
import { UserDataService } from "@/lib/userDataService";
import type { BetRecord } from "@/types/betting";
import type { CS2Strategy } from "@/types/strategy";

interface TiltBlockResult {
  blocked: boolean;
  reason: string;
  minutesLeft: number;
}

interface StrategyLimits {
  enabled?: boolean;
  blockAfterLosses?: number;
  blockDurationMinutes?: number;
}

/**
 * Tilt protection: auto-blocks betting after N consecutive losses
 * per the primary strategy's activityLimits config.
 *
 * Auto-resets when: block expires, strategy changes, or strategy is disabled.
 */
export function useTiltBlock(
  currentUser: string,
  primaryStrategy: CS2Strategy | null,
  apiBets: BetRecord[],
) {
  const [tiltTick, setTiltTick] = useState(0);
  const apiBetsRef = useRef(apiBets);
  apiBetsRef.current = apiBets;

  // Auto-reset tilt block when time expires (poll every 30s)
  const tiltBlock = useMemo((): TiltBlockResult => {
    const blockKey = `tilt_block_${currentUser}`;
    const stored = localStorage.getItem(blockKey);
    if (stored) {
      try {
        const block = JSON.parse(stored) as {
          until: number;
          reason: string;
          strategyName?: string;
        };
        if (Date.now() < block.until) {
          if (
            !primaryStrategy ||
            !primaryStrategy.activityLimits?.enabled ||
            (block.strategyName && block.strategyName !== primaryStrategy.name)
          ) {
            localStorage.removeItem(blockKey);
          } else {
            return {
              blocked: true,
              reason: block.reason,
              minutesLeft: Math.ceil((block.until - Date.now()) / 60000),
            };
          }
        } else {
          localStorage.removeItem(blockKey);
        }
      } catch {
        localStorage.removeItem(blockKey);
      }
    }

    const limits = primaryStrategy?.activityLimits as StrategyLimits | undefined;
    const blockAfter = limits?.enabled ? (limits.blockAfterLosses ?? 3) : null;

    if (!blockAfter || blockAfter < 1)
      return { blocked: false, reason: "", minutesLeft: 0 };

    const allBets =
      apiBetsRef.current.length > 0
        ? apiBetsRef.current
        : UserDataService.getUserData<BetRecord[]>(
            currentUser,
            "mybets_data",
            [],
          );

    const sorted = [...allBets]
      .filter((b: BetRecord) => b.result === "Win" || b.result === "Loss")
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return (b.createdAt || dateB) - (a.createdAt || dateA);
      });

    let consecutiveLosses = 0;
    for (const b of sorted) {
      if (b.result === "Loss") consecutiveLosses++;
      else break;
    }

    if (consecutiveLosses >= blockAfter) {
      const blockMinutes = limits?.blockDurationMinutes ?? 60;
      const until = Date.now() + blockMinutes * 60000;
      const reason = `Заблоковано через ${consecutiveLosses} поспіль програшів (потрібно ${blockAfter})`;
      localStorage.setItem(
        blockKey,
        JSON.stringify({
          until,
          reason,
          strategyName: primaryStrategy?.name || "",
        }),
      );
      UserDataService.createTiltBlock({
        until: new Date(until).toISOString(),
        reason,
        strategyName: primaryStrategy?.name || "",
      }).catch(() => {});
      return { blocked: true, reason, minutesLeft: blockMinutes };
    }

    return { blocked: false, reason: "", minutesLeft: 0 };
  }, [currentUser, primaryStrategy, tiltTick]);

  useEffect(() => {
    if (!tiltBlock.blocked) return;
    const interval = setInterval(() => {
      setTiltTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [tiltBlock.blocked]);

  return tiltBlock;
}
