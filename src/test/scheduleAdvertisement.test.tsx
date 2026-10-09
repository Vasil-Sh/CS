import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  ScheduleAdvertisement,
  type ScheduleAdCampaign,
} from "@/components/matches/ScheduleAdvertisement";

const campaign: ScheduleAdCampaign = {
  id: "test-sponsor",
  active: true,
  title: "Партнер тесту",
  description: "Опис партнерського розміщення",
  href: "https://example.com/partner",
};

afterEach(cleanup);

describe("schedule advertisement", () => {
  it("takes no space by default, for inactive campaigns or blank creatives", () => {
    const view = render(<ScheduleAdvertisement />);
    expect(view.container).toBeEmptyDOMElement();
    view.rerender(
      <ScheduleAdvertisement campaign={{ ...campaign, active: false }} />,
    );
    expect(view.container).toBeEmptyDOMElement();
    view.rerender(
      <ScheduleAdvertisement campaign={{ ...campaign, title: "  " }} />,
    );
    expect(view.container).toBeEmptyDOMElement();
  });

  it("clearly labels the non-clickable development placeholder", () => {
    render(<ScheduleAdvertisement preview />);
    expect(
      screen.getByRole("complementary", { name: "Реклама" }),
    ).toBeVisible();
    expect(screen.getByText("Ваш бренд тут")).toBeVisible();
    expect(screen.getByText("Демонстраційний банер")).toBeVisible();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a sponsor without pretending it is a match action", () => {
    render(<ScheduleAdvertisement campaign={campaign} preview />);
    const link = screen.getByRole("link", { name: /Реклама: Партнер тесту/ });
    expect(link).toHaveAttribute("href", campaign.href);
    expect(link).toHaveAttribute("rel", "sponsored noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.queryByText("Демонстраційний банер")).toBeNull();
    expect(screen.queryByText("Ваш бренд тут")).toBeNull();
  });

  it.each(["javascript:alert(1)", "data:text/html,test", "not a url"])(
    "does not make an unsafe/invalid destination clickable: %s",
    (href) => {
      render(<ScheduleAdvertisement campaign={{ ...campaign, href }} />);
      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getByText("Партнер тесту")).toBeVisible();
    },
  );

  it("supports a campaign creative and a readable fallback on image failure", () => {
    const view = render(
      <ScheduleAdvertisement
        campaign={{ ...campaign, imageUrl: "/assets/sponsor.webp" }}
      />,
    );
    const image = screen.getByRole("img", { name: "Партнер тесту" });
    expect(image).toHaveAttribute("src", "/assets/sponsor.webp");
    fireEvent.error(image);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Партнер тесту")).toBeVisible();
    view.rerender(
      <ScheduleAdvertisement
        campaign={{ ...campaign, imageUrl: "/assets/sponsor-next.webp" }}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/assets/sponsor-next.webp",
    );
    view.rerender(<ScheduleAdvertisement campaign={null} />);
    expect(view.container).toBeEmptyDOMElement();
  });
});
