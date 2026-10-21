import ArticleBody from "@/components/shared/ArticleBody";
import { buildCompareBlocks } from "@/lib/compareSections";
import styles from "./CompareBody.module.css";

export default function CompareBody({ body }) {
  const { intro, table, blocks } = buildCompareBlocks(body);

  return (
    <div className={styles.compare}>
      {intro && (
        <div className={styles.intro}>
          <ArticleBody source={intro} />
        </div>
      )}

      {table && (
        <div className={styles.tableCard}>
          <span className={styles.kicker}>{table.heading}</span>
          <ArticleBody source={table.body} />
        </div>
      )}

      {blocks.map((block, i) => {
        if (block.type === "pair") {
          return (
            <div className={styles.pairGrid} key={i}>
              {block.items.map((s, si) => (
                <div
                  className={`${styles.card} ${si === 0 ? styles.accentClay : styles.accentJade}`}
                  key={s.heading}
                >
                  <h3>{s.heading}</h3>
                  <ArticleBody source={s.body} />
                </div>
              ))}
            </div>
          );
        }

        if (block.type === "decision") {
          return (
            <div className={styles.decisionCard} key={i}>
              <h3>{block.heading}</h3>
              <div className={styles.decisionGrid}>
                {block.groups.map((g, gi) => (
                  <div
                    className={`${styles.decisionCol} ${
                      gi === 0 ? styles.accentClay : styles.accentJade
                    }`}
                    key={g.label}
                  >
                    <span className={styles.decisionLabel}>{g.label}</span>
                    <ArticleBody source={g.body} checkmarks />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        const s = block.items[0];
        return (
          <div className={styles.card} key={i}>
            {s.heading && <h3>{s.heading}</h3>}
            <ArticleBody source={s.body} />
          </div>
        );
      })}
    </div>
  );
}
