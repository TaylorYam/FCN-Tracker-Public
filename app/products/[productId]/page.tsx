import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { ProductView } from "@/components/product/ProductView";
import { getDemoProduct, getDemoProductState, listDemoProducts } from "@/lib/demo";

// Fully static: every demo product page is pre-rendered at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return listDemoProducts().map((p) => ({ productId: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = getDemoProduct(productId);
  return {
    title: product ? `${product.code} (synthetic demo)` : "Product not found",
    description: product?.scenario,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const state = getDemoProductState(productId);
  if (!state) notFound();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-5">
      <ProductView state={state} />
      <Footer />
    </main>
  );
}
