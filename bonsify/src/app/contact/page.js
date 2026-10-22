import JsonLd from "@/components/shared/JsonLd";
import ContactForm from "./ContactForm";
import Clocks from "./Clocks";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import styles from "./Contact.module.css";

export const metadata = pageMetadata({
  title: "Contact Bonsify | Get Your Shopify App",
  description:
    "Tell us about your Shopify store and we will show you what going native would change. A real person replies within a day or two.",
  path: "/contact",
});

const LAB = process.env.NEXT_PUBLIC_LAB === "1";

const STEPS = [
  ["A human reads it", "No chatbot, no routing queue. Someone who builds these apps reads your message."],
  ["You get a straight answer", "Within a day or two, and it says whether an app is worth it for your store. Sometimes it is not."],
  ["We show, not tell", "If it is a fit, you see your own store as an app before you decide anything."],
];

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <section className={styles.hero} data-dark-hero>
        <div className="wrap">
          <p className={styles.kicker}>Contact</p>
          <h1 className={styles.title}>
            Say hi.
            <br />
            <span>We reply like humans.</span>
          </h1>
          <p className={styles.lede}>
            Tell us about your Shopify store: what you sell, how much of your traffic is mobile, and where it leaks. We will come back with an honest read on whether an app earns its keep.
          </p>
        </div>
      </section>

      <section className={styles.body}>
        <div className={`wrap ${styles.grid}`}>
          <div className={styles.card}>
            <ContactForm />
          </div>

          <aside className={styles.side}>
            {LAB && (
              <a className={styles.skip} href="/#start">
                <b>Skip the form</b>
                <span>Paste your store link and watch your app build itself.</span>
                <i aria-hidden="true">&rarr;</i>
              </a>
            )}

            <div className={styles.lines}>
              <a href="mailto:hello@bonsify.io">
                <small>Email</small>
                hello@bonsify.io
              </a>
              <a href="tel:+12512779302">
                <small>Call</small>
                +1 (251) 277-9302
              </a>
            </div>

            <Clocks />

            <ol className={styles.steps}>
              {STEPS.map(([t, d], i) => (
                <li key={t}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <b>{t}</b>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>
    </main>
  );
}
