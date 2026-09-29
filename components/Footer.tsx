import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function Footer({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <footer className="mt-10 border-t border-bg-elevated pt-4 text-xs leading-relaxed text-text-secondary">
      <p>{m.footer.disclaimer}</p>
      <p className="mt-1.5 text-text-muted">{m.footer.note}</p>
    </footer>
  );
}
