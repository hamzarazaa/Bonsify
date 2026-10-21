"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Phone3D, {
  getAutoSpinRotationY,
  buildStatCardTexture,
  buildServiceCardTexture,
  buildServicesGridTexture,
  buildDockifyTexture,
} from "./Phone3D";
import { SPLASH_HOLD_MS, PHONE_REVEAL_MS } from "@/lib/introTiming";
import styles from "./PhoneJourney.module.css";

// Falls back to Dockify's own screen if the CMS-managed collection (see
// src/lib/heroScreens.js) is ever empty, so the phone never renders with
// nothing to show.
const FALLBACK_SCREEN = {
  src: "/images/dockify/install-banner.webp",
  alt: "A Shopify storefront with a native app install prompt",
};

// Matches Hero.module.css's own breakpoint for hiding the phone slot -
// below this width the phone is dropped entirely (not just made static),
// since a fixed-position 3D phone traveling over stacked single-column
// content is what caused the mobile layout to look like it was merging.
const MOBILE_QUERY = "(max-width: 900px)";

const HALF_SPIN_MS = 8500;
const SPIN_START_DELAY_MS = SPLASH_HOLD_MS + PHONE_REVEAL_MS;
const REST_ROTATION_Y = 0; // dead-on, facing camera, once landed in the Gap
const HERO_TILT_DEG = -8; // .wrapper's resting lean while still in Hero
const REST_TILT_DEG = 0; // flat, matching REST_ROTATION_Y, once landed in the Gap
const MAX_TRANSITION_SPIN_TURNS = 2;
const TWO_PI = Math.PI * 2;

// The Hero auto-spin (see getAutoSpinRotationY) is a pure timer with no
// upper bound - the longer the phone spins in Hero before the user scrolls,
// the larger this angle gets. Unwinding that whole accumulated angle back to
// REST_ROTATION_Y over the short Hero->Gap scroll range is what made the
// transition spin so much on a long dwell. Rotation is 2π-periodic, so
// dropping whole extra turns from the raw angle doesn't change which way
// the phone is currently facing - it only shortens the animated distance.
function capSpinStartAngle(rawAngle, maxTurns = MAX_TRANSITION_SPIN_TURNS) {
  const maxRadians = maxTurns * TWO_PI;
  if (Math.abs(rawAngle) <= maxRadians) return rawAngle;
  let wrapped = rawAngle % TWO_PI; // same facing angle, now within (-2π, 2π)
  if (wrapped > 0) wrapped -= TWO_PI; // the spin only ever goes negative
  return wrapped - TWO_PI * (maxTurns - 1);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpRect(a, b, t) {
  return {
    left: lerp(a.left, b.left, t),
    top: lerp(a.top, b.top, t),
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Reduced-motion only: a static phone sitting in-flow in the Gap slot,
// showing the stat card. No fixed-position travel, no spin - Phone3D
// already skips its own animation under prefers-reduced-motion, this just
// swaps the content to the stat card once mounted.
function StaticGapPhone() {
  const phoneRef = useRef(null);
  useEffect(() => {
    phoneRef.current?.setPinnedScreen(buildStatCardTexture);
  }, []);
  return <Phone3D ref={phoneRef} screens={[FALLBACK_SCREEN]} />;
}

// Rendered from layout.js (not page.js) as a sibling of Header - not nested
// inside PageTransition's fade wrapper, which (like HomeSplash ran into)
// would trap this fixed-position element's stacking below the header
// instead of comparing it at the true root. The phone's splash-reveal
// starts centered near the very top of the viewport, so that clipping
// would actually be visible here, not just theoretical.
//
// Journey: the phone spins continuously in Hero's slot (id="hero-phone-slot"
// in Hero.jsx) until the user scrolls the Gap section's landing slot
// (id="gap-phone-slot" in ProblemSection.jsx) into view, at which point it
// stops spinning, eases its position from the Hero slot to the Gap slot
// over that scroll range, and swaps to the orange stat-card screen once it
// arrives.
export default function PhoneJourney({ screens }) {
  const heroScreens = screens && screens.length > 0 ? screens : [FALLBACK_SCREEN];
  const pathname = usePathname();
  const wrapperRef = useRef(null);
  const phoneRef = useRef(null);
  const [reduce, setReduce] = useState(null);
  const [isMobile, setIsMobile] = useState(null);
  const [slots, setSlots] = useState(null);

  useEffect(() => {
    if (pathname !== "/") return;
    setReduce(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    setSlots({
      hero: document.getElementById("hero-phone-slot"),
      gap: document.getElementById("gap-phone-slot"),
      services: document.getElementById("services-phone-slot"),
      dockify: document.getElementById("dockify-phone-slot"),
    });
  }, [pathname]);

  // Tracked live (not just read once) since rotating a phone or resizing a
  // window across the breakpoint is a normal thing to do mid-visit, unlike
  // prefers-reduced-motion which effectively never changes mid-session.
  useEffect(() => {
    if (pathname !== "/") return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/" || reduce !== false || isMobile !== false) return;

    const heroSlot = document.getElementById("hero-phone-slot");
    const gapSlot = document.getElementById("gap-phone-slot");
    const serviceSlot = document.getElementById("services-phone-slot");
    const dockifySlot = document.getElementById("dockify-phone-slot");
    const phone = phoneRef.current;
    const wrapper = wrapperRef.current;
    if (!heroSlot || !gapSlot || !phone || !wrapper) return;

    const mountTime = performance.now();
    let gapProgress = 0;
    let serviceProgress = 0;
    let dockifyProgress = 0;
    const trigger = ScrollTrigger.create({
      trigger: "#gap-phone-slot",
      start: "top 85%",
      end: "top 35%",
      // A numeric scrub adds a catch-up lag (seconds) instead of tying the
      // phone 1:1 to raw scroll pixels - without it every mouse-wheel tick
      // snaps the transform instantly, which reads as fast/jerky rather
      // than smooth.
      scrub: 0.6,
      onUpdate: (self) => {
        gapProgress = self.progress;
      },
    });
    const serviceTrigger = ScrollTrigger.create({
      trigger: "#services-phone-slot",
      start: "top 85%",
      // Ends sooner than the gap/dockify triggers - this slot sits in the
      // section's own heading row, so by the time it's at a natural
      // reading position (well before "top 35%") the roll needs to already
      // be locked at a full 90deg, not caught mid-turn.
      end: "top 60%",
      scrub: 0.6,
      onUpdate: (self) => {
        serviceProgress = self.progress;
      },
    });
    const dockifyTrigger = ScrollTrigger.create({
      trigger: "#dockify-phone-slot",
      start: "top 85%",
      end: "top 35%",
      scrub: 0.6,
      onUpdate: (self) => {
        dockifyProgress = self.progress;
      },
    });

    // These only change when a media-query breakpoint flips a column's
    // display on/off (resize), never on a per-frame basis - checking them
    // via getComputedStyle() inside the render loop forced a synchronous
    // style recalc 60x/sec for the whole time this component is mounted,
    // which is most of the page's lifetime. Cache them and only re-derive
    // on resize instead.
    let gapAvailable = true;
    let serviceAvailable = true;
    let dockifyAvailable = true;
    function refreshAvailability() {
      const gapColumn = gapSlot.parentElement;
      gapAvailable = gapColumn
        ? getComputedStyle(gapColumn).display !== "none"
        : false;
      const serviceColumn = serviceSlot?.parentElement;
      serviceAvailable = serviceSlot
        ? getComputedStyle(serviceColumn).display !== "none"
        : false;
      const dockifyColumn = dockifySlot?.parentElement;
      dockifyAvailable = dockifySlot
        ? getComputedStyle(dockifyColumn).display !== "none"
        : false;
    }
    refreshAvailability();
    window.addEventListener("resize", refreshAvailability);

    // Captured once when the transition begins - the phone eases from
    // wherever it actually was (position + spin angle) at that moment, not
    // a recomputed/idealized start point, so scrolling back and forth
    // never causes a visible jump.
    let capturedStart = null;
    let serviceCapturedStart = null;
    let dockifyCapturedStart = null;
    let rafId = null;

    function loop(now) {
      rafId = requestAnimationFrame(loop);

      // heroRect is a forced-layout read (getBoundingClientRect) - only
      // worth paying for on the frames that actually need it (idle/mobile
      // fallback, or the intro easing), not unconditionally on every one of
      // the thousands of frames this loop runs over a page visit.
      let heroRect = null;
      const getHeroRect = () => heroRect || (heroRect = heroSlot.getBoundingClientRect());

      const elapsed = now - mountTime;
      const introP =
        elapsed < SPLASH_HOLD_MS
          ? 0
          : Math.min(1, (elapsed - SPLASH_HOLD_MS) / PHONE_REVEAL_MS);

      let targetRect = null;
      let tiltDeg = HERO_TILT_DEG;
      let rotateZDeg = 0;

      if (!gapAvailable) {
        // Narrow viewport - ProblemSection.module.css hides the landing
        // column, so there's nowhere to travel to. Stay in the Hero slot.
        targetRect = getHeroRect();
        capturedStart = null;
        serviceCapturedStart = null;
        phone.setRotationY(null);
        phone.setCarouselActive(true);
        phone.setPinnedScreen(null);
      } else if (dockifyProgress > 0 && dockifySlot && dockifyAvailable) {
        if (!dockifyCapturedStart) {
          dockifyCapturedStart = {
            rect: wrapper.getBoundingClientRect(),
            angle: REST_ROTATION_Y,
          };
        }
        const dockRect = dockifySlot.getBoundingClientRect();
        targetRect = lerpRect(dockifyCapturedStart.rect, dockRect, dockifyProgress);
        phone.setRotationY(REST_ROTATION_Y);
        phone.setCarouselActive(false);
        phone.setPinnedScreen(buildDockifyTexture);
        tiltDeg = REST_TILT_DEG;
        rotateZDeg = lerp(90, 0, dockifyProgress);
      } else if (serviceProgress > 0 && serviceAvailable && serviceSlot) {
        if (!serviceCapturedStart) {
          serviceCapturedStart = {
            rect: wrapper.getBoundingClientRect(),
            angle: REST_ROTATION_Y,
          };
        }
        const serviceRect = serviceSlot.getBoundingClientRect();
        targetRect = lerpRect(
          serviceCapturedStart.rect,
          serviceRect,
          serviceProgress
        );
        phone.setRotationY(REST_ROTATION_Y);
        phone.setCarouselActive(false);
        phone.setPinnedScreen(buildServicesGridTexture);
        tiltDeg = REST_TILT_DEG;
        rotateZDeg = lerp(0, 90, serviceProgress);
      } else if (gapProgress > 0) {
        serviceCapturedStart = null;
        dockifyCapturedStart = null;
        if (!capturedStart) {
          capturedStart = {
            rect: getHeroRect(),
            angle: capSpinStartAngle(
              getAutoSpinRotationY(
                elapsed,
                SPIN_START_DELAY_MS,
                HALF_SPIN_MS
              )
            ),
          };
        }
        const gapRect = gapSlot.getBoundingClientRect();
        targetRect = lerpRect(capturedStart.rect, gapRect, gapProgress);
        phone.setRotationY(
          lerp(capturedStart.angle, REST_ROTATION_Y, gapProgress)
        );
        phone.setCarouselActive(false);
        phone.setPinnedScreen(gapProgress >= 1 ? buildStatCardTexture : null);
        // The wrapper's own CSS lean (independent of the phone's internal
        // Y rotation) also eases out, so it actually sits flat once landed
        // instead of keeping Hero's tilt forever.
        tiltDeg = lerp(HERO_TILT_DEG, REST_TILT_DEG, gapProgress);
      } else {
        targetRect = getHeroRect();
        capturedStart = null;
        serviceCapturedStart = null;
        phone.setRotationY(null);
        phone.setCarouselActive(true);
        phone.setPinnedScreen(null);
      }

      // The splash-reveal (viewport-centered + enlarged, easing into the
      // Hero slot) only applies before the phone has ever settled in - once
      // scrolling starts driving the transition, introP is already at 1.
      if (introP < 1 && gapProgress <= 0 && serviceProgress <= 0) {
        const heroRectForIntro = getHeroRect();
        const eased = easeInOutCubic(introP);
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const startW = heroRectForIntro.width * 1.3;
        const startH = heroRectForIntro.height * 1.3;
        const startRect = {
          left: cx - startW / 2,
          top: cy - startH / 2,
          width: startW,
          height: startH,
        };
        targetRect = lerpRect(startRect, heroRectForIntro, eased);
      }

      wrapper.style.left = `${targetRect.left}px`;
      wrapper.style.top = `${targetRect.top}px`;
      wrapper.style.width = `${targetRect.width}px`;
      wrapper.style.height = `${targetRect.height}px`;
      wrapper.style.opacity = elapsed < SPLASH_HOLD_MS ? "0" : "1";
      wrapper.style.transform = `perspective(1300px) rotateY(${tiltDeg}deg) rotateZ(${rotateZDeg}deg)`;
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", refreshAvailability);
      trigger.kill();
      serviceTrigger.kill();
      dockifyTrigger.kill();
    };
  }, [pathname, reduce, isMobile]);

  if (pathname !== "/" || reduce === null || isMobile === null) return null;

  // Below the breakpoint, drop the phone entirely rather than fall back to
  // the static reduced-motion rendering - a phone-sized image doesn't fit
  // any of the (now hidden) portrait slots on a stacked single-column
  // mobile layout, static or not.
  if (isMobile) return null;

  if (reduce) {
    if (!slots || !slots.hero || !slots.gap) return null;
    return (
      <>
        {createPortal(
          <div className={styles.staticSlotContent}>
            <Phone3D screens={heroScreens} />
          </div>,
          slots.hero
        )}
        {createPortal(
          <div className={styles.staticSlotContent}>
            <StaticGapPhone />
          </div>,
          slots.gap
        )}
        {slots.services &&
          createPortal(
            <div className={styles.staticSlotContent}>
              <Phone3D
                screens={[
                  {
                    buildTexture: buildServicesGridTexture,
                  },
                ]}
              />
            </div>,
            slots.services
          )}
        {slots.dockify &&
          createPortal(
            <div className={styles.staticSlotContent}>
              <Phone3D
                screens={[
                  {
                    buildTexture: buildDockifyTexture,
                  },
                ]}
              />
            </div>,
            slots.dockify
          )}
      </>
    );
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper} aria-hidden="true">
      <Phone3D
        ref={phoneRef}
        screens={heroScreens}
        startDelayMs={SPIN_START_DELAY_MS}
        halfSpinMs={HALF_SPIN_MS}
      />
    </div>
  );
}
