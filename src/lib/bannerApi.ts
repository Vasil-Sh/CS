// ═══════════════════════════════════════════
// Banners API — active advertising campaigns for the matches schedule
// ═══════════════════════════════════════════

import { api } from "./apiClient";
import type { ScheduleAdCampaign } from "@/components/matches/ScheduleAdvertisement";

interface BannerRow {
  id: string;
  active: boolean;
  slot?: number;
  title: string;
  description?: string;
  imageUrl?: string;
  href?: string;
}

function toCampaign(b?: BannerRow): ScheduleAdCampaign | null {
  if (!b) return null;
  return {
    id: b.id,
    active: b.active,
    title: b.title,
    description: b.description || "",
    imageUrl: b.imageUrl || "",
    href: b.href || "",
  };
}

/**
 * Fetch active banners split by schedule slot.
 * Slot 1 = top banner (between live and upcoming sections).
 * Slot 2 = bottom banner (before finished section).
 */
export async function fetchActiveBanners(screen = "matches"): Promise<{
  top: ScheduleAdCampaign | null;
  bottom: ScheduleAdCampaign | null;
}> {
  try {
    const data = await api.get<{ banners: BannerRow[] }>(
      `/banners/active?screen=${encodeURIComponent(screen)}`,
    );
    const active = (data?.banners || []).filter(
      (b) => b.active && b.title.trim(),
    );
    const top = active.find((b) => (b.slot ?? 1) === 1);
    const bottom = active.find((b) => b.slot === 2);
    return { top: toCampaign(top), bottom: toCampaign(bottom) };
  } catch {
    // Banners are optional — never break the schedule if they fail to load.
    return { top: null, bottom: null };
  }
}

export interface BannerSlotState {
  slot: number;
  placeholderEnabled: boolean;
}

/** Fetch per-slot placeholder toggles. */
export async function fetchBannerSlots(): Promise<BannerSlotState[]> {
  try {
    const data = await api.get<{ slots: BannerSlotState[] }>("/banners/slots");
    return data?.slots || [];
  } catch {
    return [];
  }
}
