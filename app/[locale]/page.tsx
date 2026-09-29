import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoProductCard } from "@/components/DemoProductCard";
import { Footer } from "@/components/Footer";
import { formatDate } from "@/lib/dates";
import { DEMO_AS_OF, getDemoProductState, listDemoProducts } from "@/lib/demo";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  const states = listDemoProducts().map((p) => getDemoProductState(p.id)!);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10">
      {/* Hero */}
      <section className="pb-10 pt-12 sm:pt-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-purple">
          {m.landing.eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
          FCN Tracker
        </h1>
        <p className="mt-2 text-lg font-medium text-text-secondary sm:text-xl">{m.landing.subtitle}</p>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-text-secondary">{m.landing.intro}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="#demo-products"
            className="rounded-lg bg-text-primary px-5 py-2.5 text-sm font-medium text-bg-surface transition-opacity hover:opacity-90"
          >
            {m.landing.ctaExplore}
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-lg border border-text-secondary/30 px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-surface"
          >
            {m.landing.ctaHow}
          </Link>
        </div>
      </section>

      {/* Demo products */}
      <section id="demo-products" className="scroll-mt-16 pb-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">
            {m.landing.productsHeading}
          </h2>
          <p className="text-[12px] text-text-muted">
            {m.landing.valuationNote(formatDate(DEMO_AS_OF, locale))}
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {states.map((s) => (
            <DemoProductCard key={s.config.id} state={s} locale={locale} />
          ))}
        </div>
      </section>

      {/* Three pillars */}
      <section className="grid gap-6 pb-12 lg:grid-cols-3">
        <div className="rounded-xl bg-bg-surface p-5">
          <h2 className="text-base font-semibold text-text-primary">{m.landing.logicTitle}</h2>
          <dl className="mt-3 space-y-3">
            {m.landing.concepts.map((c) => (
              <div key={c.key}>
                <dt className="text-[13px] font-semibold text-text-primary">{c.term}</dt>
                <dd className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">
                  {m.glossary[c.key]}
                  {c.key === "performance" && ` ${m.glossary.worst}`}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl bg-bg-surface p-5">
          <h2 className="text-base font-semibold text-text-primary">{m.landing.workflowTitle}</h2>
          <ol className="mt-3 space-y-3">
            {m.landing.workflow.map((w, i) => (
              <li key={w.step} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-blue text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-text-primary">{w.step}</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">{w.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl bg-bg-surface p-5">
          <h2 className="text-base font-semibold text-text-primary">{m.landing.architectureTitle}</h2>
          <ol className="mt-3 space-y-1.5 text-[12px]">
            {m.landing.architectureBoxes.map((box, i, arr) => (
              <li key={box} className="text-center">
                <div className="rounded-md border border-bg-elevated bg-bg-base/60 px-3 py-1.5 font-medium text-text-primary">
                  {box}
                </div>
                {i < arr.length - 1 && (
                  <div aria-hidden className="text-text-muted">
                    ↓
                  </div>
                )}
              </li>
            ))}
          </ol>
          <ul className="mt-4 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-text-secondary">
            {m.landing.architectureNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* How the demo works */}
      <section id="how-it-works" className="scroll-mt-16 rounded-xl bg-bg-surface p-5 sm:p-7">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">{m.landing.howTitle}</h2>
        <div className="mt-4 grid gap-5 text-[13px] leading-relaxed text-text-secondary md:grid-cols-2">
          {m.landing.how.map((h) => (
            <p key={h.lead}>
              <strong className="text-text-primary">{h.lead}</strong> {h.text}
            </p>
          ))}
        </div>
        <p className="mt-5 text-[12px] text-text-muted">{m.landing.howNote}</p>
      </section>

      <Footer locale={locale} />
    </main>
  );
}
