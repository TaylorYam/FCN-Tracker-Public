export function Footer() {
  return (
    <footer className="mt-10 border-t border-bg-elevated pt-4 text-xs leading-relaxed text-text-secondary">
      <p>
        This repository is a personal research and engineering project for informational and
        educational purposes only. The products, prices, terms and scenarios shown in the public
        demonstration are synthetic. It is not investment advice and is not affiliated with,
        sponsored by, or endorsed by my employer.
      </p>
      <p className="mt-1.5 text-text-muted">
        All underlyings (ALPHA, BETA, GAMMA …) are fictional. Price paths are generated
        deterministically from authored scenario anchors; no market data is fetched.
      </p>
    </footer>
  );
}
