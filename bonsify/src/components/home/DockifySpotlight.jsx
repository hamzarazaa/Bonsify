"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
// PhoneMockup & RewardCard removed - 3D phone will replace them via PhoneJourney
import styles from "./DockifySpotlight.module.css";

const features = [
  "One tap to the home screen - a real PWA, no App Store review or delay.",
  "Automatic discount code delivered the moment they install.",
  "Merchant dashboard with install-to-purchase attribution.",
  "Works across iOS and Android from the same install prompt.",
];

export default function DockifySpotlight() {
  const sectionRef = useRef(null);
  const phoneRef = useRef(null);
  const rewardRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 85%",
      end: "top 30%",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        const ry = 22 - p * 26;
        const rx = 8 - p * 8;
        const y = 60 - p * 60;
        if (phoneRef.current) {
          phoneRef.current.style.transform = `perspective(1400px) rotateY(${ry}deg) rotateX(${rx}deg) translateY(${y}px)`;
        }
        if (rewardRef.current) {
          const rp = Math.max(0, Math.min(1, (p - 0.55) / 0.35));
          rewardRef.current.style.opacity = rp.toFixed(3);
          rewardRef.current.style.transform = `translateY(${(1 - rp) * 40}px)`;
        }
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section className={`section ${styles.dockify}`} id="dockify" ref={sectionRef}>
      <div className="wrap">
        <div className={styles.grid}>
          <div className={styles.copy}>
            <RevealOnScroll as="span" className="eyebrow">
              Our Shopify App Store app
            </RevealOnScroll>
            <RevealOnScroll as="h2">
              Dockify: add to home screen, instantly rewarded
            </RevealOnScroll>
            <RevealOnScroll as="p" className={styles.lead}>
              Dockify turns a browser visit into a home screen install - and
              rewards the customer for making it. A discount code on
              install, full attribution back to you, so you know exactly
              which install drove which purchase.
            </RevealOnScroll>
            <ul className={styles.feat}>
              {features.map((f) => (
                <RevealOnScroll as="li" key={f}>
                  <svg className={styles.fi} viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10 L8 14 L16 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{f}</span>
                </RevealOnScroll>
              ))}
            </ul>
            <RevealOnScroll as="span">
              <Link className={styles.btn} href="/work/dockify">
                Explore Dockify
              </Link>
            </RevealOnScroll>
          </div>
          <div className={styles.phoneCol}>
            <div className={styles.phoneSlot} id="dockify-phone-slot" />
          </div>
        </div>
      </div>
    </section>
  );
}
