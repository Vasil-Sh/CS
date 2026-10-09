// ═══════════════════════════════════════════
// Banners API — active advertising campaigns for the matches schedule
// ═══════════════════════════════════════════

import { api } from "./apiClient";
import type { ScheduleAdCampaign } from "@/components/matches/ScheduleAdvertisement";

interface BannerRow {
  id: string;
  active: boolean;
  title: string;
  description?: string;
  imageUrl?: string;
  href?: string;
}

/** Fetch active banners and return the first one as a schedule campaign. */
export async function fetchActiveBanner(): Promise<ScheduleAdCampaign | null> {
  try {
    const data = await api.get<{ banners: BannerRow[] }>("/banners/active");
    const first = data?.banners?.find((b) => b.active && b.title.trim());
    if (!first) return null;
    return {
      id: first.id,
      active: first.active,
      title: first.title,
      description: first.description || "",
      imageUrl: first.imageUrl || "",
      href: first.href || "",
    };
  } catch {
    // Banners are optional — never break the schedule if they fail to load.
    return null;
  }
}
