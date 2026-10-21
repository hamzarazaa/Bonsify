"use client";

import styles from "./BonsifyLoader.module.css";

// The Bonsify mark, traced from /images/logos/icon-light.webp, split into the
// bag (with its handle) and the two bars of the B so each can animate.
export const BAG = "M157.7 576.3C156.5 575.1 157.0 565.0 158.4 561.7C162.2 552.9 168.9 550.2 190.5 549.0C252.3 545.6 291.0 518.6 299.0 473.4C300.9 462.7 299.8 434.9 297.1 424.7C287.4 388.0 251.3 358.1 200.8 345.0L192.2 342.7L201.1 338.4C239.4 319.8 258.6 287.4 255.0 247.8C249.6 188.8 206.2 154.5 133.3 151.3L119.1 150.7L118.4 146.3C117.1 137.2 119.6 131.3 126.4 127.7C130.5 125.5 130.5 125.5 204.2 125.2C244.8 125.1 278.0 124.8 278.0 124.6C278.0 124.4 276.4 119.5 274.4 113.8C260.0 72.1 230.3 45.4 193.3 40.8C148.4 35.3 105.1 72.3 90.5 128.7C86.3 144.7 85.4 154.5 87.3 162.3C89.4 170.5 89.4 174.0 87.5 178.8C81.9 192.1 66.7 194.7 57.7 184.0C52.8 178.3 52.4 174.1 55.4 160.0C56.8 153.1 58.7 143.4 59.6 138.5C66.5 99.1 80.4 70.4 104.4 46.4C121.2 29.7 136.1 20.4 155.0 14.6C216.7 -4.1 279.9 36.3 304.0 109.8C306.2 116.5 308.0 122.7 308.0 123.5C308.0 124.8 313.6 125.0 349.4 125.0L390.8 125.0L391.4 131.8C392.2 139.1 397.6 190.6 398.5 198.0C399.3 205.5 411.9 321.5 415.1 351.5C416.7 366.9 419.2 389.9 420.5 402.5C425.2 445.5 429.9 489.4 434.5 531.9C437.0 555.3 438.8 575.0 438.6 575.7C438.0 577.1 159.1 577.7 157.7 576.3Z";
export const BAR_TOP = "M9.0 480.4C9.0 479.2 18.1 393.5 18.4 391.0C18.7 389.6 18.9 388.2 18.9 387.7C19.0 387.3 57.4 387.1 104.2 387.2L189.5 387.5L197.2 391.2C237.9 410.6 232.8 468.2 189.5 479.5C184.4 480.8 171.4 481.0 96.3 481.0C48.3 481.0 9.0 480.7 9.0 480.4Z";
export const BAR_BOTTOM = "M28.0 306.8C28.0 304.0 30.2 283.5 35.5 235.3C36.3 228.0 37.0 221.4 37.0 220.5C37.0 219.1 42.3 219.0 90.8 219.2L144.5 219.5L152.0 223.1C192.2 242.5 186.1 298.3 142.8 308.5C137.6 309.7 126.6 310.0 82.2 310.0L28.0 310.0L28.0 306.8Z";

// Shown inside the phone while a Figma prototype loads: the bag outline draws
// itself, fills, then the two bars of the B slide in. Loops until removed.
export default function BonsifyLoader({ label, bar = true }) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <svg className={styles.mark} viewBox="0 0 448 586" aria-hidden="true">
        <path className={styles.bag} d={BAG} pathLength="1" />
        <path className={`${styles.bar} ${styles.barTop}`} d={BAR_TOP} />
        <path className={`${styles.bar} ${styles.barBottom}`} d={BAR_BOTTOM} />
      </svg>
      {bar && (
        <span className={styles.track} aria-hidden="true">
          <i />
        </span>
      )}
      {label && (
        <span key={label} className={styles.label}>
          {label}
        </span>
      )}
    </div>
  );
}
