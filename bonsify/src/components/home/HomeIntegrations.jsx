import Link from "next/link";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { INTEGRATION_COUNT } from "@/lib/integrations";
import s from "@/components/integrations/Integrations.module.css";

const HEADLINERS = ["Klaviyo", "Recharge", "Yotpo", "Okendo", "Judge.me", "Gorgias", "Rebuy", "Smile.io", "Attentive", "Triple Whale", "Skio", "Loop Returns"];

export default function HomeIntegrations() {
  return (
    <section className="section section-ink" id="integrations">
      <div className="wrap">
        <RevealOnScroll>
          <span className="eyebrow">Integrations</span>
          <h2 className="sec-title" style={{ marginTop: 14 }}>
            Your Shopify apps come with you
          </h2>
          <p style={{ marginTop: 16, maxWidth: 680, fontSize: 18, lineHeight: 1.6, opacity: 0.8 }}>
            Reviews, loyalty, subscriptions, search, messaging and support keep working
            inside the app. {INTEGRATION_COUNT}+ apps supported.
          </p>
          <ul className={s.strip}>
            {HEADLINERS.map((n) => (
              <li key={n}>{n}</li>
            ))}
            <li>+ {INTEGRATION_COUNT - HEADLINERS.length} more</li>
          </ul>
          <Link className="btn btn-clay" href="/integrations" style={{ marginTop: 28, display: "inline-block" }}>
            See all integrations
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
