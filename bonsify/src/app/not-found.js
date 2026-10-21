import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <section data-dark-hero className="section section-ink" style={{ minHeight: "60vh", display: "flex", alignItems: "center" }}>
        <div className="wrap-narrow" style={{ textAlign: "center" }}>
          <span className="eyebrow">404</span>
          <h1 className="sec-title" style={{ marginTop: 14 }}>
            This page isn&apos;t live yet
          </h1>
          <p style={{ marginTop: 20, fontSize: 18, opacity: 0.8, maxWidth: "50ch", marginLeft: "auto", marginRight: "auto" }}>
            Either the link is off, or this page hasn&apos;t launched publicly
            yet. Head back to the homepage or see what we&apos;ve built.
          </p>
          <div style={{ marginTop: 34, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn btn-clay" href="/">
              Back to home
            </Link>
            <Link className="btn btn-ghost" href="/work">
              See our work
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
