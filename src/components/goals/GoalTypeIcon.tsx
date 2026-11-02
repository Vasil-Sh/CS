import type { GoalType } from "@/hooks/useGoals";

const ICON_PATH: Record<GoalType, string> = {
  amount: "M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6.5 12h.01M17.5 12h.01",
  roi: "M3 17l6-6 4 4 8-8M15 7h6v6",
  winrate:
    "M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  ladder: "M4 20h4v-4h4v-4h4V8h4V4",
};

export function GoalTypeIcon({ type, size = 18 }: { type: GoalType; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATH[type]} />
    </svg>
  );
}

