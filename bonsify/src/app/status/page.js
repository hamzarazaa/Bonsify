import { CLIENTS } from "@/lib/clients";

export const metadata = {
  title: "Admin - Client Visibility | Bonsify",
  robots: { index: false, follow: false },
};

const GATED = CLIENTS.filter((c) => c.slug !== "dockify");

export default function AdminPage() {
  return (
    <main>
      <section className="section section-ink" style={{ paddingTop: 160 }}>
        <div className="wrap-narrow">
          <span className="eyebrow">Internal</span>
          <h1 className="sec-title" style={{ marginTop: 14 }}>
            Client visibility
          </h1>
          <p style={{ marginTop: 20, fontSize: 18, opacity: 0.8 }}>
            This reflects the last deployed build - it's baked in at build
            time, so it can only change on the next rebuild.
          </p>

          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
            {GATED.map((c) => (
              <div
                key={c.slug}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  border: "1px solid var(--line-dark)",
                  borderRadius: 10,
                }}
              >
                <span style={{ fontFamily: "var(--sans)", fontSize: 20 }}>
                  {c.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "6px 12px",
                    borderRadius: 6,
                    color: c.visible ? "var(--jade)" : "var(--sand)",
                    background: c.visible
                      ? "rgba(47,107,79,0.15)"
                      : "rgba(244,239,228,0.08)",
                  }}
                >
                  {c.visible ? "Visible" : "Hidden"}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontFamily: "var(--sans)", fontSize: 22, color: "var(--bone)" }}>
              To change this
            </h2>
            <ol style={{ marginTop: 16, paddingLeft: 22, opacity: 0.85, lineHeight: 1.8 }}>
              <li>Open the project in the Vercel dashboard.</li>
              <li>Settings -&gt; Environment Variables.</li>
              <li>
                Set <code>NEXT_PUBLIC_SHOW_BACHAPARTY</code> and/or{" "}
                <code>NEXT_PUBLIC_SHOW_HIGHFY</code> to <code>true</code> (or{" "}
                <code>false</code> to hide again).
              </li>
              <li>Redeploy - this is a static export, so it takes a rebuild.</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
