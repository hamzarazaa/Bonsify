import styles from "./WhyApp.module.css";

const REASONS = [
  ["Slow first load", "Every visit starts in a browser tab, so shoppers wait before they see a product."],
  ["No place on the home screen", "Once the tab closes, the only way back is a search or another paid ad."],
  ["No direct line", "Restocks and offers go to email, where most of them are never opened."],
  ["Checkout from scratch", "Addresses and card details are typed again on a small screen."],
];

export default function WhyApp() {
  return (
    <section className={styles.section}>
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.stat}>
          <strong>130%</strong>
          <p>more orders from shoppers in an app than on mobile web.</p>
          <small>Venn Apps, 2025</small>
        </div>
        <div>
          <h2>Where mobile web loses people.</h2>
          <dl className={styles.list}>
            {REASONS.map(([h, p]) => (
              <div key={h}>
                <dt>{h}</dt>
                <dd>{p}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
