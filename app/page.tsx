import Link from "next/link";
import { DemoProductCard } from "@/components/DemoProductCard";
import { Footer } from "@/components/Footer";
import { formatDate } from "@/lib/dates";
import { DEMO_AS_OF, getDemoProductState, listDemoProducts } from "@/lib/demo";
import { GLOSSARY } from "@/lib/glossary";

const CONCEPTS: { term: string; text: string }[] = [
  { term: "Coupon schedule", text: GLOSSARY.coupon },
  { term: "Observation periods", text: GLOSSARY.observation },
  { term: "Knock-out level", text: GLOSSARY.ko },
  { term: "Strike level", text: GLOSSARY.strike },
  { term: "Memory KO", text: GLOSSARY.memory },
  { term: "Underlying performance", text: `${GLOSSARY.performance} ${GLOSSARY.worst}` },
  { term: "Maturity state", text: GLOSSARY.maturity },
];

const WORKFLOW: { step: string; text: string }[] = [
  {
    step: "Define terms",
    text: "Coupon rate, tenor, KO / strike / KI levels, observation rule and underlyings are captured as a typed product definition; the coupon schedule is generated from the initial observation date.",
  },
  {
    step: "Assemble price paths",
    text: "Per-ticker daily closes are combined into one per-product series from the trade date, then limited to the valuation date.",
  },
  {
    step: "Evaluate observations",
    text: "The engine selects the observation dates (every close, or monthly dates only), applies the non-call period, and evaluates memory or same-day KO.",
  },
  {
    step: "Derive product state",
    text: "Status (non-call, active, knocked out, matured), coupon status, worst performer, distance to barriers, KI events and maturity settlement.",
  },
  {
    step: "Present",
    text: "Server-rendered pages show the summary, timeline, underlying table, KO condition, coupon periods and an interactive price-path chart.",
  },
];

export default function Landing() {
  const states = listDemoProducts().map((p) => getDemoProductState(p.id)!);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10">
      {/* Hero */}
      <section className="pb-10 pt-12 sm:pt-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-purple">
          Portfolio demonstration · synthetic data
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
          FCN Tracker
        </h1>
        <p className="mt-2 text-lg font-medium text-text-secondary sm:text-xl">
          Structured Product Monitoring Platform
        </p>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
          An interactive portfolio demonstration showing how Fixed Coupon Note terms and
          multi-underlying price paths can be translated into structured product monitoring logic.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="#demo-products"
            className="rounded-lg bg-text-primary px-5 py-2.5 text-sm font-medium text-bg-surface transition-opacity hover:opacity-90"
          >
            Explore Demo Products
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-lg border border-text-secondary/30 px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-surface"
          >
            How the demo works
          </Link>
        </div>
      </section>

      {/* Demo products */}
      <section id="demo-products" className="scroll-mt-16 pb-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">
            Explore Demo Products
          </h2>
          <p className="text-[12px] text-text-muted">
            Demo valuation date {formatDate(DEMO_AS_OF)} · all terms and prices synthetic
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {states.map((s) => (
            <DemoProductCard key={s.config.id} state={s} />
          ))}
        </div>
      </section>

      {/* Three pillars */}
      <section className="grid gap-6 pb-12 lg:grid-cols-3">
        <div className="rounded-xl bg-bg-surface p-5">
          <h2 className="text-base font-semibold text-text-primary">1. Product Logic</h2>
          <dl className="mt-3 space-y-3">
            {CONCEPTS.map((c) => (
              <div key={c.term}>
                <dt className="text-[13px] font-semibold text-text-primary">{c.term}</dt>
                <dd className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">{c.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl bg-bg-surface p-5">
          <h2 className="text-base font-semibold text-text-primary">2. Monitoring Workflow</h2>
          <ol className="mt-3 space-y-3">
            {WORKFLOW.map((w, i) => (
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
          <h2 className="text-base font-semibold text-text-primary">3. Engineering Architecture</h2>
          <ol className="mt-3 space-y-1.5 text-[12px]">
            {[
              "Synthetic product definition",
              "Synthetic price series",
              "FCN state engine",
              "KO / strike / coupon evaluation",
              "Product state",
              "Next.js UI + charts",
            ].map((box, i, arr) => (
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
            <li>Next.js App Router, React and TypeScript; every page statically generated.</li>
            <li>Pure, framework-free engine in <code>lib/</code> — deterministic and unit-tested.</li>
            <li>Recharts for the price-path chart; Tailwind CSS for styling.</li>
            <li>CI runs a public-content scanner, <code>node:test</code> suites and a production build.</li>
            <li>No credentials, databases or network calls are needed to run the demo.</li>
          </ul>
        </div>
      </section>

      {/* How the demo works */}
      <section id="how-it-works" className="scroll-mt-16 rounded-xl bg-bg-surface p-5 sm:p-7">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">How the Demo Works</h2>
        <div className="mt-4 grid gap-5 text-[13px] leading-relaxed text-text-secondary md:grid-cols-2">
          <p>
            <strong className="text-text-primary">Multiple underlyings.</strong> Each FCN references
            a basket of three or four fictional stocks. Every price is expressed relative to that
            stock&apos;s initial fixing, and the product is <em>worst-of</em>: the weakest
            underlying drives the maturity outcome.
          </p>
          <p>
            <strong className="text-text-primary">Predefined coupons.</strong> The annualized coupon
            and the monthly schedule are fixed at issue. Coupons are paid whatever the underlyings
            do; they stop only when the note is redeemed early after a knock-out.
          </p>
          <p>
            <strong className="text-text-primary">KO on observation dates.</strong> The knock-out
            condition is not checked during the first (non-call) period. After that it is checked
            on every close (daily) or only on each period&apos;s observation end date (monthly). When
            it is met, the note redeems at 100% of notional plus that period&apos;s coupon.
          </p>
          <p>
            <strong className="text-text-primary">Memory KO.</strong> With memory, each underlying
            that closes at or above KO on an observation date is recorded, and the note knocks out
            once every underlying has a record — even on different days. Without memory, all
            underlyings must be at or above KO on the same observation date.
          </p>
          <p>
            <strong className="text-text-primary">Strike and maturity.</strong> If no KO occurs, the
            worst performer&apos;s final level is compared with the strike. At or above strike the
            note repays 100% in cash; below strike the investor receives that underlying&apos;s
            shares at the strike price — unless a knock-in barrier applies and was not breached.
          </p>
          <p>
            <strong className="text-text-primary">Knock-in styles.</strong> An EKI barrier is tested
            only on the final valuation date; an AKI barrier on every daily close during the tenor.
            The demo uses inclusive KO (≥) and strict strike / KI (&lt;) boundaries; real term sheets
            define these individually.
          </p>
        </div>
        <p className="mt-5 text-[12px] text-text-muted">
          Each product page also re-runs the same synthetic path under the alternative KO rules (and,
          for the matured example, the alternative KI styles) so the effect of each rule is visible.
          Those comparisons are educational only.
        </p>
      </section>

      <Footer />
    </main>
  );
}
