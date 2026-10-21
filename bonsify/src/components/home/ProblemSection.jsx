import RevealOnScroll from "@/components/shared/RevealOnScroll";
import styles from "./ProblemSection.module.css";

export default function ProblemSection() {
  return (
    <section className="section section-bone" id="problem">
      <div className="wrap">
        <RevealOnScroll as="span" className="eyebrow">
          The gap
        </RevealOnScroll>
        <RevealOnScroll as="h2" className="sec-title">
          A browser tab isn&apos;t a home screen
        </RevealOnScroll>
        <div className={styles.grid}>
          <div className={styles.phoneCol}>
            {/* Invisible layout placeholder - PhoneJourney.jsx renders the
                actual phone in a fixed-position overlay and reads this
                element's rect to know where it lands after leaving Hero. */}
            <div className={styles.phoneSlot} id="gap-phone-slot" />
          </div>
          <div className={styles.body}>
            <RevealOnScroll as="p">
              A browser storefront asks a mobile customer to do more work for
              less reward.
            </RevealOnScroll>
            <RevealOnScroll as="p">
              Slower loads. No home screen presence. No push notifications.
              No offline access. Every extra tap is a place the sale quietly
              leaks out.
            </RevealOnScroll>
            <RevealOnScroll as="p">
              A native app closes that gap - higher repeat purchase rate,
              better retention, a direct line to the customer that doesn&apos;t
              depend on an algorithm or an inbox. Most stores never build one,
              because it&apos;s usually slow, expensive, and needs a dev team
              they don&apos;t have.
            </RevealOnScroll>
            <RevealOnScroll as="p" className={styles.question}>
              What would change if your store lived on the home screen
              instead of in a browser tab?
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
