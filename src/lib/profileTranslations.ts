import { getLang, t } from "./i18n";
import type { profileTranslations } from "./profileTranslationData";
type ProfileKey =
  keyof typeof profileTranslations extends `profile.ui.${infer K}` ? K : never;
export const profileLocale = () => (getLang() === "en" ? "en-US" : "uk-UA");
export function pt(
  key: ProfileKey,
  params: Record<string, string | number> = {},
): string {
  return t(`profile.ui.${key}`).replace(/\{(\w+)\}/g, (match, name) =>
    String(params[name] ?? match),
  );
}
