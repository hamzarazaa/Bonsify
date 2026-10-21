import styles from "./HomeServices.module.css";
import p from "./HomeProcess.module.css";

const STEPS = [
  ["Audit", "We review your store and customer flow to find exactly where mobile is leaking sales."],
  ["Build", "Native app or PWA, matched to what your store needs. Nothing bloated, nothing generic."],
  ["Launch", "Live on the App Store and Google Play, or on the home screen as a PWA."],
  ["Support", "We maintain and improve the app after launch, so it keeps earning its place."],
];

export default function HomeProcess() {
  return (
    <section className={p.section} id="process">
      <div className="wrap">
        <div className={p.head}>
          <h2 className={styles.dockTitle}>How it works.</h2>
          <p>From the first call to the App Store.</p>
        </div>
        <ol className={p.steps}>
          {STEPS.map(([h, t], n) => (
            <li key={h}>
              <span>0{n + 1}</span>
              <h3>{h}</h3>
              <p>{t}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
