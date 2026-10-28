import { useEffect, useState } from "react";
import { fetchActiveBanners } from "@/lib/bannerApi";
import { ScheduleAdvertisement } from "@/components/matches/ScheduleAdvertisement";
const screens: Record<string, string> = {
  "/app/my-bets": "journal",
  "/app/analytics": "analytics",
  "/app/strategy": "strategies",
  "/app/risky-teams": "risky-teams",
};
export default function ScreenBanners({
  path,
  slot,
}: {
  path: string;
  slot: "top" | "bottom";
}) {
  const screen = screens[path];
  const [data, setData] = useState<
    Awaited<ReturnType<typeof fetchActiveBanners>>
  >({ top: null, bottom: null });
  useEffect(() => {
    let live = true;
    setData({ top: null, bottom: null });
    if (!screen) return;
    const update = () =>
      fetchActiveBanners(screen).then((value) => {
        if (live) setData(value);
      });
    void update();
    const timer = setInterval(update, 60000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [screen]);
  if (!screen || !data[slot]) return null;
  return (
    <div style={{ padding: "16px 24px" }}>
      <ScheduleAdvertisement campaign={data[slot]} />
    </div>
  );
}
