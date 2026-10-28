import { act, render, screen, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import ScreenBanners from "@/components/ScreenBanners";
import { fetchActiveBanners } from "@/lib/bannerApi";
vi.mock("@/lib/bannerApi", () => ({ fetchActiveBanners: vi.fn() }));
vi.mock("@/components/matches/ScheduleAdvertisement", () => ({
  ScheduleAdvertisement: ({ campaign }: { campaign: { title: string } }) => (
    <div>{campaign.title}</div>
  ),
}));
beforeEach(() => {
  vi.mocked(fetchActiveBanners).mockReset();
  vi.mocked(fetchActiveBanners).mockResolvedValue({
    top: { id: "1", active: true, title: "Campaign" },
    bottom: null,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("application banner placements", () => {
  it.each([
    ["my-bets", "journal"],
    ["analytics", "analytics"],
    ["strategy", "strategies"],
    ["risky-teams", "risky-teams"],
  ])("loads banners on %s", async (path, placement) => {
    render(<ScreenBanners path={"/app/" + path} slot="top" />);
    expect(await screen.findByText("Campaign")).toBeInTheDocument();
    expect(fetchActiveBanners).toHaveBeenCalledWith(placement);
  });
  it("does not add duplicate placements on matches or unknown pages", () => {
    render(<ScreenBanners path="/app/matches" slot="top" />);
    expect(fetchActiveBanners).not.toHaveBeenCalled();
  });
  it("removes expired campaigns on refresh and cleans up its timer", async () => {
    vi.useFakeTimers();
    const view = render(<ScreenBanners path="/app/analytics" slot="top" />);
    await act(async () => {});
    expect(screen.getByText("Campaign")).toBeInTheDocument();
    vi.mocked(fetchActiveBanners).mockResolvedValue({
      top: null,
      bottom: null,
    });
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.queryByText("Campaign")).not.toBeInTheDocument();
    view.unmount();
    const count = vi.mocked(fetchActiveBanners).mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    expect(fetchActiveBanners).toHaveBeenCalledTimes(count);
  });
});
