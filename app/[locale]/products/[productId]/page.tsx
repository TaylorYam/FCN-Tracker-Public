import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { ProductView } from "@/components/product/ProductView";
import { getDemoProduct, getDemoProductState, listDemoProducts } from "@/lib/demo";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

// Fully static: every demo product page is pre-rendered for every locale.
export const dynamicParams = false;

export function generateStaticParams() {
  return listDemoProducts().map((p) => ({ productId: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}): Promise<Metadata> {
  const { locale, productId } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  const product = getDemoProduct(productId);
  return {
    title: product ? m.meta.productTitle(product.code) : m.meta.notFound,
    description: product ? (m.scenarios[product.id] ?? product.scenario) : undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale, productId } = await params;
  if (!isLocale(locale)) notFound();
  const state = getDemoProductState(productId);
  if (!state) notFound();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-5">
      <ProductView state={state} locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
