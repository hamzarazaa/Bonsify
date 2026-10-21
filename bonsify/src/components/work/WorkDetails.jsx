import Link from "next/link";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import FAQBlock from "@/components/shared/FAQBlock";
import styles from "./WorkDetails.module.css";

export const WORK_FAQ = [
  {
    q: "Are these real apps in the App Store and Google Play?",
    a: "Yes. The apps above are live in the stores under each brand's own name and developer account. The download and rating figures on this page are read from the public store listings and dated where shown.",
  },
  {
    q: "Who owns the app after launch?",
    a: "The merchant. The app, the App Store and Google Play listings, and the customer data all sit in the merchant's own accounts. Bonsify builds and runs the app on their behalf and can hand over everything at any time.",
  },
  {
    q: "How long did these builds take?",
    a: "A typical Bonsify build runs from a few weeks to a couple of months, depending on catalogue size, custom features and how long Apple's review takes. First App Store submissions can take up to two weeks in review on their own.",
  },
  {
    q: "Can I try the apps before I talk to you?",
    a: "Yes. Each app below has a working prototype you can tap through in the browser, and the live apps can be installed from the store links. A proposal page for your own store can show your catalogue in a working app before any commitment.",
  },
  {
    q: "What kind of stores do you build for?",
    a: "Shopify stores of any category. Recent work covers beauty, kids and fashion. We publish category guidance for fashion, beauty, footwear, jewelry, food and beverage, pet, electronics, home, sports, supplements and streetwear on our industries pages.",
  },
  {
    q: "Do the apps keep working with the Shopify apps we already use?",
    a: "Yes. Reviews, loyalty, subscriptions, search, email and SMS, support and analytics apps connect to the mobile app, so shoppers see the same points, prices and reviews as on the web. The full list is on our integrations page.",
  },
];

const INCLUDED = [
  ["Your whole catalogue", "Every product, variant, price and image comes from the live Shopify store, so the app never drifts out of date."],
  ["Checkout that already works", "Customers pay through your own Shopify checkout, with the same payment methods, discounts and shipping rules."],
  ["Push that sells", "Restock alerts, drops, abandoned carts and order updates, set up around Shopify events and sent from day one."],
  ["Install strategy", "A reason to install, such as a first-order offer, and attribution that ties each install to the revenue it produces."],
  ["Store submission handled", "Listing copy, screenshots, review notes and resubmissions for the App Store and Google Play."],
  ["Run after launch", "OS updates, Shopify API changes, fixes and new features on an optional monthly retainer."],
];

const PROCESS = [
  ["Free audit", "We go through your store on a phone, mark where shoppers drop off and show you what an app would change. You keep the findings either way."],
  ["Build", "We design and build the app around your catalogue and branding, and you tap through a working version before it ships."],
  ["Launch", "We submit to the App Store and Google Play, switch on push and the install prompt, and watch the first numbers."],
  ["Support", "We maintain the app and improve it every month, with a fixed quote and no percentage of your sales."],
];

export default function WorkDetails() {
  return (
    <>
      <section className="section section-bone">
        <div className="wrap">
          <RevealOnScroll>
            <span className="eyebrow">What is in every build</span>
            <h2 className="sec-title" style={{ marginTop: 14 }}>
              The same foundations, in every app
            </h2>
            <p className={styles.lead}>
              Each app on this page started from the same list. Brand and catalogue change; the parts that make an app
              earn its place do not.
            </p>
          </RevealOnScroll>
          <div className={styles.grid}>
            {INCLUDED.map(([h, p]) => (
              <div key={h} className={styles.card}>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <RevealOnScroll>
            <span className="eyebrow">How it goes</span>
            <h2 className="sec-title" style={{ marginTop: 14 }}>
              From audit to the App Store
            </h2>
          </RevealOnScroll>
          <ol className={styles.steps}>
            {PROCESS.map(([h, p]) => (
              <li key={h}>
                <div>
                  <b>{h}</b>
                  <span>{p}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className={styles.links}>
            <Link href="/how-we-work">How we work</Link>
            <Link href="/integrations">Apps we integrate</Link>
            <Link href="/services/mobile-app-development">Mobile app development</Link>
            <Link href="/vs/tapcart">Bonsify vs Tapcart</Link>
            <Link href="/industries">Industries</Link>
          </div>
        </div>
      </section>

      <section className="section section-bone">
        <div className="wrap-narrow">
          <span className="eyebrow">Questions about our work</span>
          <h2 className="sec-title" style={{ marginTop: 14, marginBottom: 28 }}>
            What people ask before they book
          </h2>
          <FAQBlock items={WORK_FAQ} />
        </div>
      </section>
    </>
  );
}
