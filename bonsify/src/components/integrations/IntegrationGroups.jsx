import { INTEGRATION_GROUPS } from "@/lib/integrations";
import styles from "./Integrations.module.css";

export default function IntegrationGroups() {
  return (
    <div className={styles.grid}>
      {INTEGRATION_GROUPS.map((g) => (
        <section key={g.id} className={styles.group} aria-labelledby={`int-${g.id}`}>
          <h3 id={`int-${g.id}`}>
            {g.title}
            <span>{g.apps.length}</span>
          </h3>
          <ul className={styles.chips}>
            {g.apps.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
