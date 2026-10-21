"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import BlogThumb from "@/components/blog/BlogThumb";
import { getBlogTopicLabel } from "@/lib/blogTopics";
import styles from "./BlogIndex.module.css";

export default function BlogBrowse({ basePath, entries, topics }) {
  const [activeTopic, setActiveTopic] = useState("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesTopic = activeTopic === "all" || entry.topicKey === activeTopic;
      const matchesQuery =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q);
      return matchesTopic && matchesQuery;
    });
  }, [entries, activeTopic, query]);

  return (
    <>
      <div className={styles.pillRow}>
        <button
          type="button"
          className={`${styles.pill} ${activeTopic === "all" ? styles.pillActive : ""}`}
          onClick={() => setActiveTopic("all")}
        >
          All
        </button>
        {topics.map((t) => (
          <button
            type="button"
            key={t.key}
            className={`${styles.pill} ${activeTopic === t.key ? styles.pillActive : ""}`}
            onClick={() => setActiveTopic(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Browse all</h2>
        <div className={styles.searchWrap}>
          <svg viewBox="0 0 20 20" fill="none" className={styles.searchIcon}>
            <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.6" />
            <line x1="13.2" y1="13.2" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles"
            aria-label="Search articles"
          />
        </div>
      </div>

      <div className={styles.browseGrid}>
        {visible.map((entry) => (
          <RevealOnScroll as="div" key={entry.slug}>
            <Link className={styles.postCard} href={`${basePath}/${entry.slug}`}>
              <BlogThumb entry={entry} size="md" />
              <div className={styles.postBody}>
                <span className={styles.tag}>{getBlogTopicLabel(entry.topicKey)}</span>
                <h3>{entry.title}</h3>
                <p>{entry.description}</p>
              </div>
            </Link>
          </RevealOnScroll>
        ))}
      </div>
      {visible.length === 0 && (
        <p className={styles.empty}>No articles match that search.</p>
      )}
    </>
  );
}
