"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_LABEL,
  switchLocalePath,
  type Locale,
} from "@/lib/i18n/config";

/**
 * Segmented EN / 繁中 control. Each option links to the same page in the
 * other locale (static route, no reload of data) and stores the choice in a
 * first-party preference cookie so that "/" opens in that language next time.
 */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}`;

  function remember(target: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <nav aria-label={label} className="flex items-center rounded-md border border-text-secondary/25 p-0.5">
      {LOCALES.map((target) => {
        const active = target === locale;
        return (
          <Link
            key={target}
            href={switchLocalePath(pathname, target)}
            hrefLang={target}
            lang={target === "zh-TW" ? "zh-Hant-TW" : "en"}
            scroll={false}
            prefetch={false}
            onClick={() => remember(target)}
            aria-current={active ? "true" : undefined}
            title={LOCALE_LABEL[target].full}
            className={`rounded px-2 py-1 text-[12px] font-medium leading-none transition-colors ${
              active
                ? "bg-text-primary text-bg-surface"
                : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
            }`}
          >
            <span className="sm:hidden">{LOCALE_LABEL[target].short}</span>
            <span className="hidden sm:inline">{LOCALE_LABEL[target].full}</span>
          </Link>
        );
      })}
    </nav>
  );
}
