import { useState } from "react";
import "./ScheduleAdvertisement.css";

export type ScheduleAdCampaign = {
  id: string;
  active: boolean;
  title: string;
  description?: string;
  imageUrl?: string;
  href?: string;
};

export type ScheduleAdvertisementProps = {
  campaign?: ScheduleAdCampaign | null;
  preview?: boolean;
};

function sponsorLink(value?: string) {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

/** No trackers, external scripts or empty placeholder in production without a campaign. */
export function ScheduleAdvertisement({
  campaign,
  preview = false,
}: ScheduleAdvertisementProps) {
  const [failedImage, setFailedImage] = useState<string>();
  const active = campaign?.active && campaign.title.trim() ? campaign : null;
  if (!active && !preview) return null;

  const title = active?.title || "Ваш бренд тут";
  const description = active?.description ?? "Партнерське розміщення";
  const href = active ? sponsorLink(active.href) : undefined;
  const image = active?.imageUrl;
  const content =
    image && image !== failedImage ? (
      <img
        className="ms-ad__image"
        src={image}
        alt={title}
        decoding="async"
        onError={() => setFailedImage(image)}
      />
    ) : (
      <>
        <div className="ms-ad__copy">
          <strong>{title}</strong>
          {description && <span>{description}</span>}
        </div>
        <div className="ms-ad__art" aria-hidden="true">
          <i className="ms-ad__diamond" />
          <i className="ms-ad__disc" />
          <i className="ms-ad__accent" />
          <i className="ms-ad__ring" />
          <i className="ms-ad__corner" />
          <i className="ms-ad__dots" />
        </div>
      </>
    );

  return (
    <aside className="ms-ad" aria-label="Реклама">
      <div className="ms-ad__label">
        <span>Реклама</span>
        {!active && (
          <span className="ms-ad__preview">Демонстраційний банер</span>
        )}
      </div>
      {href ? (
        <a
          className="ms-ad__creative"
          href={href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          aria-label={`Реклама: ${title} (відкриється в новій вкладці)`}
        >
          {content}
        </a>
      ) : (
        <div className="ms-ad__creative">{content}</div>
      )}
    </aside>
  );
}
