/**
 * Inter + Inter Tight are used by the app screens only. The landing,
 * login and legal pages use Manrope (loaded in index.html), so the app
 * fonts are requested lazily when an app route's module is first loaded.
 */
const APP_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&family=Inter:wght@400;500;600;700&display=swap";

export function ensureAppFonts() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[href="${APP_FONTS_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = APP_FONTS_HREF;
  document.head.appendChild(link);
}
