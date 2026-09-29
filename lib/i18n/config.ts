export const LOCALES = ["en", "zh-TW"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Cookie that remembers the visitor's language choice (read by the "/" redirect). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** BCP 47 tag for the <html lang> attribute. */
export function htmlLang(locale: Locale): string {
  return locale === "zh-TW" ? "zh-Hant-TW" : "en";
}

/** Short label shown in the language switcher. */
export const LOCALE_LABEL: Record<Locale, { short: string; full: string }> = {
  en: { short: "EN", full: "English" },
  "zh-TW": { short: "繁中", full: "繁體中文" },
};

/** Prefix an app path ("/", "/products/x", "/#anchor") with a locale. */
export function localePath(locale: Locale, path = "/"): string {
  if (path === "/" || path === "") return `/${locale}`;
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The same page in another locale: swaps (or adds) the leading locale
 * segment of a pathname, e.g. "/en/products/x" → "/zh-TW/products/x".
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const parts = pathname.split("/");
  if (parts.length > 1 && isLocale(parts[1])) {
    parts[1] = target;
    return parts.join("/") || `/${target}`;
  }
  return localePath(target, pathname);
}
