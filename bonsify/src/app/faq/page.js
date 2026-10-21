import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import FAQBlock from "@/components/shared/FAQBlock";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "FAQ - Shopify Apps, PWAs & Pricing | Bonsify",
  description:
    "Common questions about pricing, ownership, timelines, PWAs vs native apps, and Dockify - answered straight.",
  path: "/faq",
});

const groups = [
  {
    heading: "Getting started",
    items: [
      {
        q: "Does my Shopify store need a mobile app?",
        a: "Not automatically. The case is strongest when a store has meaningful repeat purchase potential, most traffic on mobile, and working conversion fundamentals. Roughly 75% of ecommerce traffic is mobile (Statista, 2025), and apps convert about 130% higher than mobile web (Venn Apps, 2025), but an app amplifies a working store rather than fixing a broken one. Under roughly $10,000 a month in revenue, fix fundamentals first.",
      },
      {
        q: "What is the difference between a PWA and a native app?",
        a: "A PWA (progressive web app) installs to the home screen straight from the browser: no app store, no download wait, no review process. A native app is built for iOS and Android, lives in the app stores, and has full access to device features and push. PWAs win on install friction and speed to launch. Native wins on capability, polish and App Store presence. Many stores run the PWA first to prove demand, then fund the native build with data.",
      },
      {
        q: "Which should I build first?",
        a: "If install demand is unproven: PWA first. It produces install and purchase data within weeks at low cost. If your brand already has heavy repeat purchase or a drops model: native first is defensible.",
      },
    ],
  },
  {
    heading: "Working with Bonsify",
    items: [
      {
        q: 'What does "done-for-you" actually mean?',
        a: "You do not design in an editor, run submissions or manage updates. We audit, build, launch and maintain. You review and approve at each phase. One team is accountable from first audit to the update that ships two years later.",
      },
      {
        q: "How is Bonsify different from Tapcart, Vajro or Shopney?",
        a: "Those are self-serve builders: monthly SaaS tools you configure and run yourself, mostly webview-based, often with fees that scale with your order volume. Bonsify is a service: native builds (or PWAs) delivered and maintained for you, priced as a fixed scoped engagement with no percentage-of-sales fees. Builders win on entry price and self-serve control. We win when you want the outcome without the job.",
      },
      {
        q: "How much does it cost?",
        a: "Fixed quote after a small paid audit. More than a builder subscription, a fraction of the $100,000-plus traditional custom route. No success fees, no GMV percentage, no volume tier jumps.",
      },
      {
        q: "How long does it take?",
        a: "PWA: days to two weeks. Native iOS and Android: several weeks including store review. First Apple submissions can sit in review up to two weeks and rejections are routine for first-timers; we handle resubmission.",
      },
      {
        q: "Do I own the app?",
        a: "Yes. The app, the App Store and Google Play listings, and all customer data belong to you.",
      },
      {
        q: "Do I need Apple and Google developer accounts?",
        a: "For native apps, yes: Apple ($99 per year) and Google Play ($25 one-time). We handle setup and submission through them. PWAs need neither.",
      },
    ],
  },
  {
    heading: "After launch",
    items: [
      {
        q: "Who maintains the app?",
        a: "We do, on an optional monthly retainer covering OS updates, Shopify API changes, fixes and new features. Cancel anytime; the app keeps running but stops receiving updates from us.",
      },
      {
        q: "How do customers find out the app exists?",
        a: 'Install strategy ships with launch. Typically a reward-on-install prompt on your storefront (our Dockify app): the customer adds your store to their home screen, gets a discount code instantly, and the install is attributed to the order it produces. "We have an app" is not an install strategy; a reason to install is.',
      },
      {
        q: "What results can I expect?",
        a: "We do not promise numbers we have not measured on your store. The published benchmarks: apps convert around 130% higher than mobile web, app users spend 6.4 times more session time, and mobile web cart abandonment runs about 85% versus roughly 20% in apps (Venn Apps; Barilliance). Your audit establishes your baseline; attribution measures the change.",
      },
    ],
  },
  {
    heading: "Dockify",
    items: [
      {
        q: "What is Dockify?",
        a: "Dockify is Bonsify's own Shopify app. It adds a home screen install prompt to your store, delivers a discount code the moment a customer installs, and links each install to the purchase it produces in a merchant dashboard.",
      },
      {
        q: "Is Dockify on the Shopify App Store?",
        a: "Submitted and in review.",
      },
      {
        q: "Does Dockify work on iOS and Android?",
        a: "Yes. Android shows the native install banner; iOS uses an add-to-home-screen instruction flow. Both paths deliver the reward code.",
      },
      {
        q: "Can I use Dockify without a full Bonsify engagement?",
        a: "Yes. It installs standalone from the Shopify App Store like any app. It is also the install layer inside full engagements.",
      },
    ],
  },
  {
    heading: "Practical",
    items: [
      {
        q: "Do you work with platforms other than Shopify?",
        a: "No. Shopify only, on purpose.",
      },
      {
        q: "Where is Bonsify based?",
        a: "Santa Ana, California and Karachi, Pakistan. Engagements are remote-first.",
      },
      {
        q: "What happens on the first call?",
        a: "Thirty minutes. You walk us through the store and the mobile numbers you have. We tell you honestly whether an app is worth it and what the audit would cover. No deck, no pressure sequence.",
      },
    ],
  },
];

const allItems = groups.flatMap((g) => g.items);

export default function FAQPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
      <JsonLd data={faqPageSchema(allItems)} />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
        title="Frequently asked questions"
        lede="Common questions about pricing, ownership, timelines, and the free audit."
      />

      <section className="section section-ink">
        <div className="wrap-narrow">
          {groups.map((group) => (
            <div key={group.heading} style={{ marginBottom: 50 }}>
              <RevealOnScroll
                as="h2"
                className="sec-title"
                style={{ fontSize: 24, marginBottom: 10 }}
              >
                {group.heading}
              </RevealOnScroll>
              <FAQBlock items={group.items} injectSchema={false} />
            </div>
          ))}
        </div>
      </section>

      <CTABand
        heading="Still have questions?"
        subtext="Tell us about your Shopify store. We'll give you a straight answer."
        buttonText="Book a free audit"
        buttonHref="/contact"
      />
    </main>
  );
}
