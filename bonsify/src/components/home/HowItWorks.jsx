"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "Audit",
    desc: "We review your store and customer flow to find exactly where mobile is leaking sales.",
  },
  {
    title: "Build",
    desc: "Native app or PWA, matched to what your store actually needs - nothing bloated, nothing generic.",
  },
  {
    title: "Launch",
    desc: "Live on the App Store and Google Play, or installed straight to the home screen with Dockify.",
  },
  {
    title: "Support",
    desc: "We maintain and iterate after launch, so the app keeps earning its place instead of going stale.",
  },
];

const SEGMENTS = steps.length - 1;

export default function HowItWorks() {
  const trackRef = useRef(null);
  const lineRef = useRef(null);
  const fillRef = useRef(null);
  const stepRefs = useRef([]);
  const dotRefs = useRef([]);

  useEffect(() => {
    const track = trackRef.current;
    const line = lineRef.current;
    const fill = fillRef.current;
    if (!track || !line || !fill) return;

    // The line must span exactly from the first dot's center to the last
    // dot's center - measured from the real DOM rects rather than assumed
    // as a fixed percentage, so it can't drift from the dots regardless of
    // padding/content/breakpoint changes.
    let span = 0;
    let currentProgress = 0;

    function layout() {
      const first = dotRefs.current[0];
      const last = dotRefs.current[dotRefs.current.length - 1];
      if (!first || !last) return;
      const trackRect = track.getBoundingClientRect();
      const firstRect = first.getBoundingClientRect();
      const lastRect = last.getBoundingClientRect();
      const left = firstRect.left + firstRect.width / 2 - trackRect.left;
      const rightCenter = lastRect.left + lastRect.width / 2 - trackRect.left;
      const top = firstRect.top + firstRect.height / 2 - trackRect.top;
      span = Math.max(0, rightCenter - left);
      line.style.left = `${left}px`;
      line.style.top = `${top}px`;
      line.style.width = `${span}px`;
      fill.style.left = `${left}px`;
      fill.style.top = `${top}px`;
      fill.style.width = `${currentProgress * span}px`;
    }

    function applyProgress(p) {
      currentProgress = Math.max(0, Math.min(1, p));
      fill.style.width = `${currentProgress * span}px`;
      const complete = currentProgress >= 1;
      const activeIndex = Math.min(
        SEGMENTS,
        Math.round(currentProgress * SEGMENTS)
      );
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        el.classList.toggle(styles.done, complete || i < activeIndex);
        el.classList.toggle(styles.current, !complete && i === activeIndex);
      });
    }

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    layout();

    if (reduce) {
      applyProgress(1);
      window.addEventListener("resize", layout);
      return () => window.removeEventListener("resize", layout);
    }

    applyProgress(0);
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top 85%",
      end: "top 30%",
      scrub: true,
      onUpdate: (self) => applyProgress(self.progress),
    });
    window.addEventListener("resize", layout);

    return () => {
      trigger.kill();
      window.removeEventListener("resize", layout);
    };
  }, []);

  return (
    <section className="section section-bone" id="process">
      <div className="wrap">
        <span className="eyebrow">The process</span>
        <div className={styles.card}>
          <div className={styles.track} ref={trackRef}>
            <div className={styles.line} ref={lineRef} />
            <div className={styles.fill} ref={fillRef} />
            {steps.map((step, i) => (
              <div
                className={styles.step}
                key={step.title}
                ref={(el) => (stepRefs.current[i] = el)}
              >
                <span
                  className={styles.dot}
                  ref={(el) => (dotRefs.current[i] = el)}
                >
                  <span className={styles.dotInner} />
                  <svg
                    className={styles.check}
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12.5l4.5 4.5L19 7"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className={styles.label}>{step.title}</span>
                <p className={styles.desc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
