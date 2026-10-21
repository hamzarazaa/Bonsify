"use client";

import { useState } from "react";
import Phone from "@/components/proposals/Phone";
import LivePrototype from "@/components/proposals/LivePrototype";
import styles from "./CaseStudy.module.css";

// The clickable Figma prototype of the app on the case study page, with a
// Start over button outside the phone.
export default function CasePrototype({ app }) {
  const [run, setRun] = useState(0);
  return (
    <div className={styles.protoCol}>
      <div className={styles.protoPhone}>
        <Phone label={`${app.name} app, clickable prototype`}>
          <LivePrototype app={app} run={run} />
        </Phone>
      </div>
      <button className={styles.restart} onClick={() => setRun((n) => n + 1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Start over
      </button>
    </div>
  );
}
