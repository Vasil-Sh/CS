/**
 * Minimal, provider-agnostic click tracking for the landing page.
 *
 * Nothing is sent anywhere by itself. When an analytics tool is added
 * (Google Tag Manager / GA4, Plausible or Umami), its global is picked up
 * automatically. Any other tool can listen to the `matchiq:track` event.
 */
type TrackProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    plausible?: (event: string, options?: { props?: TrackProps }) => void;
    umami?: { track: (event: string, props?: TrackProps) => void };
  }
}

export function track(event: string, props: TrackProps = {}) {
  try {
    window.dataLayer?.push({ event, ...props });
    window.plausible?.(event, { props });
    window.umami?.track(event, props);
    window.dispatchEvent(
      new CustomEvent("matchiq:track", { detail: { event, ...props } }),
    );
    if (import.meta.env.DEV) console.debug("[track]", event, props);
  } catch {
    /* tracking must never break the page */
  }
}

/** Telegram link that opens @cs2beet with a ready-to-send message. */
export const TELEGRAM_USERNAME = "cs2beet";
export function telegramLink(text: string) {
  return `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`;
}
