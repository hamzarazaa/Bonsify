import Link from "next/link";
import { CATEGORIES, appsInCategory } from "@/lib/integrations";
import AppLogo from "./AppLogo";
import styles from "./Integrations.module.css";

// Every category with its apps as logo tiles. Each tile opens the app's page,
// each heading opens the category page.
export default function IntegrationGroups({ limit = 12 }) {
  return (
    <div className={styles.cats}>
      {CATEGORIES.map((c) => {
        const apps = appsInCategory(c.id);
        const shown = apps.slice(0, limit);
        return (
          <section key={c.id} className={styles.cat} aria-labelledby={`int-${c.id}`}>
            <header>
              <h3 id={`int-${c.id}`}>
                <Link href={`/integration-categories/${c.id}`}>{c.title}</Link>
              </h3>
              <p>{c.short}</p>
            </header>
            <ul className={styles.tiles}>
              {shown.map((a) => (
                <li key={a.slug}>
                  <Link href={`/integrations/${a.slug}`} className={styles.tile}>
                    <AppLogo app={a} />
                    <span>{a.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/integration-categories/${c.id}`} className={styles.more}>
              {apps.length > shown.length ? `See all ${apps.length} apps` : `Open ${c.title}`} &rarr;
            </Link>
          </section>
        );
      })}
    </div>
  );
}
