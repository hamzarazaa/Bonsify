"use client";

import { useState } from "react";
import JsonLd from "./JsonLd";
import { faqPageSchema } from "@/lib/schema";
import styles from "./FAQBlock.module.css";

export default function FAQBlock({ items = [], injectSchema = true }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className={styles.faq}>
      {injectSchema && <JsonLd data={faqPageSchema(items)} />}
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div
            key={item.q}
            className={`${styles.item} ${open ? styles.open : ""}`}
          >
            <button
              type="button"
              className={styles.question}
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
            >
              <span>{item.q}</span>
              <span className={styles.icon} aria-hidden="true" />
            </button>
            <div className={styles.answer}>
              <p className={styles.answerInner}>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
