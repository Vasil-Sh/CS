import type { ScheduleAdvertisementProps } from "@/components/matches/ScheduleAdvertisement";

/** Configure a direct sponsor here; null/inactive campaigns occupy no production space. */
export const matchScheduleAdvertising: ScheduleAdvertisementProps = {
  campaign: null,
  // Show the approved placeholder only in local development, never in production.
  preview: import.meta.env.DEV,
};
