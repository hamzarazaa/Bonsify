import Link from "next/link";
import LabBranches from "@/components/lab/LabBranches";
import styles from "./CTABand.module.css";

export default function CTABand({ heading, subtext, buttonText, buttonHref }) {
  return (
    <section className={`lab-cta ${styles.ctaBand}`}>
      <LabBranches seed={heading} tone="color-mix(in oklab, var(--clay) 70%, white)" strength={0.9} />
      <div className={styles.fold}>
        <div className={styles.crease} />
      </div>
      <div className={`wrap ${styles.inner}`}>
        <h2>{heading}</h2>
        {subtext && <p className={styles.sub}>{subtext}</p>}
        <Link className={styles.btn} href={buttonHref}>
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
