import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Normalize a bet.date string (DD.MM.YYYY or YYYY-MM-DD or DD/MM/YYYY or ISO with time) → YYYY-MM-DD */
export function normalizeDateStr(dateStr: string): string {
  if (!dateStr) return "";
  const dotMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch)
    return `${dotMatch[3]}-${dotMatch[2].padStart(2, "0")}-${dotMatch[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // ISO datetime: "2026-09-01T14:00:00" (with or without timezone)
  const isoMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (isoMatch) return isoMatch[1];
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch)
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[1].padStart(2, "0")}`;
  return dateStr;
}
