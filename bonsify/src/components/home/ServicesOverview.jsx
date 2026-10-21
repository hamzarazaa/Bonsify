import RevealOnScroll from "@/components/shared/RevealOnScroll";
import styles from "./ServicesOverview.module.css";

export default function ServicesOverview() {
  return (
    <section className="section section-bone" id="services">
      <div className="wrap">
        <div className={styles.head}>
          <RevealOnScroll as="h2">Done for you, start to finish</RevealOnScroll>
          <div className={styles.phoneSlot} id="services-phone-slot" />
        </div>
      </div>
    </section>
  );
}
