import PageHero from "@/components/shared/PageHero";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import JsonLd from "@/components/shared/JsonLd";
import ContactForm from "./ContactForm";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import styles from "./Contact.module.css";

export const metadata = pageMetadata({
  title: "Contact Bonsify - Book a Free Shopify App Audit",
  description:
    "Tell us about your Shopify store and we'll show you what going native would change.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        title="Let's put your store on the home screen"
        lede="Tell us about your Shopify store - what you sell, how much of your traffic is mobile, and where it's leaking. We'll come back with an honest read on whether an app is worth it for you."
      />

      <section className="section section-bone">
        <div className="wrap">
          <div className={styles.grid}>
            <div>
              <ContactForm />
            </div>
            <RevealOnScroll as="div" className={styles.side}>
              <div className={styles.block}>
                <p className={styles.sideLabel}>Prefer email?</p>
                <a href="mailto:hello@bonsify.io">hello@bonsify.io</a>
              </div>
              <div className={styles.block}>
                <p className={styles.sideLabel}>Or call us</p>
                <a href="tel:+12512779302">+1 (251) 277-9302</a>
              </div>
              <div className={styles.block}>
                <p className={styles.sideLabel}>Where we are</p>
                <svg
                  className={styles.map}
                  viewBox="0 0 300 90"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M62 50 Q 150 -10 238 50"
                    stroke="var(--line)"
                    strokeWidth="1.5"
                    strokeDasharray="3 5"
                  />
                  <circle cx="62" cy="50" r="5" fill="var(--jade)" />
                  <circle cx="238" cy="50" r="5" fill="var(--clay)" />
                  <text x="62" y="72" textAnchor="middle" className={styles.mapLabel}>
                    US
                  </text>
                  <text x="238" y="72" textAnchor="middle" className={styles.mapLabel}>
                    PK
                  </text>
                </svg>
                <address className={styles.address}>
                  US: 1942 Blair Ave, Santa Ana, CA 92705
                </address>
                <address className={styles.address}>
                  PK: Building S4, NASTP-2, Office 18A, Shahra-e-Faisal,
                  Karachi 75400
                </address>
              </div>
              <div className={styles.block}>
                <p className={styles.sideLabel}>What happens next</p>
                <p style={{ opacity: 0.75, fontSize: 15, lineHeight: 1.65 }}>
                  We read every message ourselves. Within a day or two
                  you&apos;ll get a real reply - not a calendar link and a
                  bot - with a straight answer on whether going native makes
                  sense for your store.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>
    </main>
  );
}
