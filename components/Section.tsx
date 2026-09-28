export function Section({
  title,
  aside,
  children,
  className = "",
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-6 ${className}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-secondary">{title}</h2>
        {aside && <div className="text-[11px] text-text-muted">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-bg-surface ${className}`}>{children}</div>;
}
