"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SPLASH_HOLD_MS } from "@/lib/introTiming";
import styles from "./Hero.module.css";

export default function Hero() {
  const heroWrapRef = useRef(null);
  const heroRef = useRef(null);
  const planeBottomRef = useRef(null);
  const creaseRef = useRef(null);
  const creaseGlowRef = useRef(null);
  const contentRef = useRef(null);
  const scrollCueRef = useRef(null);

  useEffect(() => {
    const heroEl = heroRef.current;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Text/CTA reveal (the .intro class drives the fadeUp/lineUp keyframes
    // in Hero.module.css) waits for the splash to open so it appears as the
    // phone (rendered by PhoneJourney, not this component - see
    // src/components/home/PhoneJourney.jsx) starts sliding into place,
    // instead of racing ahead of it. With no splash (reduced motion), skip
    // straight to the settled state.
    const textRevealTimer = setTimeout(
      () => heroEl.classList.add(styles.intro),
      reduce ? 0 : SPLASH_HOLD_MS
    );

    if (reduce) {
      return () => clearTimeout(textRevealTimer);
    }

    let scrollProgress = 0;
    const trigger = ScrollTrigger.create({
      trigger: heroWrapRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollProgress = self.progress;
        scheduleFrame();
      },
    });

    let rafId = null;
    function scheduleFrame() {
      if (rafId === null) {
        rafId = requestAnimationFrame(loop);
      }
    }
    function loop() {
      rafId = null;
      const p = scrollProgress;
      const b = 60 - p * 18;
      const t = 30 - p * 20;
      if (planeBottomRef.current) {
        planeBottomRef.current.style.clipPath = `polygon(0 ${b}%,100% ${t}%,100% 100%,0 100%)`;
      }
      if (creaseRef.current) {
        creaseRef.current.style.opacity = (0.35 + p * 0.6).toFixed(3);
      }
      if (creaseGlowRef.current) {
        creaseGlowRef.current.style.opacity = (0.5 + p * 0.5).toFixed(3);
        creaseGlowRef.current.style.height = `${60 + p * 70}px`;
      }
      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${-p * 55}px)`;
        contentRef.current.style.opacity = Math.max(0, 1 - p * 0.9).toFixed(3);
      }
      if (scrollCueRef.current) {
        scrollCueRef.current.style.opacity = Math.max(0, 0.7 - p * 1.4).toFixed(
          3
        );
      }
    }
    loop();

    return () => {
      clearTimeout(textRevealTimer);
      cancelAnimationFrame(rafId);
      trigger.kill();
    };
  }, []);

  return (
    <div className={styles.heroWrap} ref={heroWrapRef}>
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.fold}>
          <div className={styles.planeTop} />
          <div className={styles.planeBottom} ref={planeBottomRef} />
          <div className={styles.creaseGlow} ref={creaseGlowRef} />
          <div className={styles.crease} ref={creaseRef} />
          <div className={styles.sheen} />
        </div>
        <div className={styles.vignette} />
        <div className={styles.inner}>
          <div className={styles.content} ref={contentRef}>
            <div className="eyebrow">Shopify mobile apps · done for you</div>
            <h1>
              <span className={`${styles.lineMask} ${styles.lm1}`}>
                <span className={styles.lineInner}>
                  Your store already converts.
                </span>
              </span>{" "}
              <span className={`${styles.lineMask} ${styles.lm2}`}>
                <span className={styles.lineInner}>
                  Your <span className={styles.accent}>phone screen</span>{" "}
                  doesn&apos;t.
                </span>
              </span>
            </h1>
            <p className={styles.sub}>
              Bonsify turns Shopify stores into native mobile apps - built,
              launched, and maintained for you. Beyond the browser tab, onto
              the home screen.
            </p>
            <div className={styles.ctaRow}>
              <Link className={`${styles.btn} ${styles.btnClay}`} href="#process">
                See how it works
              </Link>
            </div>
          </div>
          <div className={styles.visual}>
            <div className={styles.hvGlow} />
            {/* Invisible layout placeholder only - PhoneJourney.jsx renders
                the actual phone in a fixed-position overlay and measures
                this element's rect to know where to sit/land during Hero. */}
            <div className={styles.hvRig} id="hero-phone-slot" />
          </div>
        </div>
        <div className={styles.scrollCue} ref={scrollCueRef}>
          <span>Scroll</span>
          <span className={styles.bar} />
        </div>
      </section>
    </div>
  );
}
