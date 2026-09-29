import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function SiteHeader({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <header className="border-b border-bg-elevated/70 bg-bg-base/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href={localePath(locale)} className="flex min-w-0 items-baseline gap-2 text-text-primary">
          <span className="shrink-0 text-[15px] font-semibold tracking-tight">FCN Tracker</span>
          <span className="hidden truncate text-[11px] text-text-muted md:inline">{m.header.tagline}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <nav className="hidden items-center gap-4 text-[12px] text-text-secondary sm:flex">
            <Link href={localePath(locale, "/#demo-products")} className="hover:text-text-primary">
              {m.header.navProducts}
            </Link>
            <Link href={localePath(locale, "/#how-it-works")} className="hover:text-text-primary">
              {m.header.navHow}
            </Link>
          </nav>
          <LanguageSwitcher locale={locale} label={m.header.language} />
        </div>
      </div>
    </header>
  );
}
