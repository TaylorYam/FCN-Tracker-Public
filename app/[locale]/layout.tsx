import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { LOCALES, htmlLang, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

// Every locale is pre-rendered; unknown locales are 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return {
    title: { default: m.meta.title, template: "%s · FCN Tracker" },
    description: m.meta.description,
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8dcc4",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={htmlLang(locale)}>
      <body className="min-h-screen bg-bg-base font-sans text-text-primary antialiased">
        <SiteHeader locale={locale} />
        {children}
      </body>
    </html>
  );
}
