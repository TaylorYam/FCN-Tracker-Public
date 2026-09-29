export function SyntheticBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded border border-accent-purple/40 bg-accent-purple/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-purple ${className}`}
      title="All product terms, dates and prices on this page are synthetic."
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-purple" />
      Synthetic demo
    </span>
  );
}
