import RevealOnScroll from "@/components/shared/RevealOnScroll";
import CountUp from "@/components/shared/CountUp";
import styles from "./Outcomes.module.css";

const STATS = [
  {
    to: 130,
    suffix: "%",
    label: "higher conversion than the mobile web (Venn Apps, 2025)",
  },
  {
    to: 100,
    suffix: "%",
    label: "of installs attributed back to the exact campaign",
  },
  {
    to: 0,
    suffix: "",
    label: "dev hires needed - build, launch, and upkeep are on us",
  },
];

export default function Outcomes() {
  return (
    <section className="section section-bone">
      <div className="wrap">
        <RevealOnScroll as="div" className={styles.card}>
          <span className="eyebrow">What changes when you go native</span>
          <h2 className={styles.heading}>
            The home screen is the shortest path back to your store
          </h2>
          <div className={styles.grid}>
            {STATS.map((s) => (
              <RevealOnScroll as="div" className={styles.stat} key={s.label}>
                <b>
                  <CountUp to={s.to} suffix={s.suffix} />
                </b>
                <span>{s.label}</span>
              </RevealOnScroll>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
