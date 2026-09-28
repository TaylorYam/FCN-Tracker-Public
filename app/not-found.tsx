import Link from "next/link";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col px-4 pt-10">
      <div className="flex-1">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">Page not found</h1>
        <p className="mt-2 text-sm text-text-secondary">
          This portfolio edition contains three synthetic demo products only.
        </p>
        <Link
          href="/#demo-products"
          className="mt-5 inline-block rounded-lg bg-bg-surface px-4 py-2 text-sm text-text-primary transition-colors hover:bg-bg-elevated"
        >
          ← Explore demo products
        </Link>
      </div>
      <Footer />
    </main>
  );
}
