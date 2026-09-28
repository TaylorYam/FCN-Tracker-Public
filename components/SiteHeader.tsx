import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-bg-elevated/70 bg-bg-base/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2 text-text-primary">
          <span className="text-[15px] font-semibold tracking-tight">FCN Tracker</span>
          <span className="hidden text-[11px] text-text-muted sm:inline">
            Structured Product Monitoring Platform
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-[12px] text-text-secondary">
          <Link href="/#demo-products" className="hover:text-text-primary">
            Demo products
          </Link>
          <Link href="/#how-it-works" className="hover:text-text-primary">
            How it works
          </Link>
        </nav>
      </div>
    </header>
  );
}
