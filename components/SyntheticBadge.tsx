import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function SyntheticBadge({ locale, className = "" }: { locale: Locale; className?: string }) {
  const m = getMessages(locale);
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded border border-accent-purple/40 bg-accent-purple/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-purple ${className}`}
      title={m.badge.title}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-purple" />
      {m.badge.text}
    </span>
  );
}
