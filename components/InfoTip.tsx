import { useId } from "react";

/**
 * Small explanatory tooltip. CSS-only (hover and keyboard focus), so it
 * works inside server components and needs no JavaScript.
 */
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={id}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-text-muted/50 text-[9px] font-semibold leading-none text-text-muted transition-colors hover:border-text-secondary hover:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 w-64 max-w-[78vw] -translate-x-1/2 rounded-md bg-text-primary px-3 py-2 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-bg-surface opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
