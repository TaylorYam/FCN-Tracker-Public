import { useId } from "react";

/**
 * Small explanatory tooltip. CSS-only (hover and keyboard focus), so it
 * works inside server components and needs no JavaScript.
 *
 * Hidden tooltips use display:none so they never widen the page. On phones
 * the open tooltip is pinned to the bottom of the viewport (16px gutters)
 * instead of floating above the icon, so it cannot be clipped at an edge.
 */
export function InfoTip({ ariaLabel, children }: { ariaLabel: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-describedby={id}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-text-muted/50 text-[9px] font-semibold leading-none text-text-muted transition-colors hover:border-text-secondary hover:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-64 -translate-x-1/2 rounded-md bg-text-primary px-3 py-2 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-bg-surface shadow-lg group-focus-within:block group-hover:block max-sm:fixed max-sm:bottom-4 max-sm:left-4 max-sm:right-4 max-sm:mb-0 max-sm:w-auto max-sm:translate-x-0 max-sm:text-[12px]"
      >
        {children}
      </span>
    </span>
  );
}
