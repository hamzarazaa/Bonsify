import Image from "next/image";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import styles from "./Screenshot.module.css";

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path
      d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

export default function ScreenshotGrid({ shots, width = 393, height = 852, columns }) {
  return (
    <div
      className={styles.grid}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)`, maxWidth: 480 } : undefined}
    >
      {shots.map((shot) =>
        shot.placeholder ? (
          <RevealOnScroll
            as="figure"
            className={`${styles.shot} ${styles.placeholder}`}
            key={shot.caption}
          >
            <div
              className={styles.placeholderBody}
              style={{ aspectRatio: `${shot.width || width} / ${shot.height || height}` }}
            >
              <CameraIcon />
              <span className={styles.placeholderLabel}>Coming soon</span>
            </div>
            <figcaption className={styles.caption}>{shot.caption}</figcaption>
          </RevealOnScroll>
        ) : (
          <RevealOnScroll as="figure" className={styles.shot} key={shot.src}>
            <Image
              src={shot.src}
              alt={shot.caption}
              width={shot.width || width}
              height={shot.height || height}
            />
            <figcaption className={styles.caption}>{shot.caption}</figcaption>
          </RevealOnScroll>
        )
      )}
    </div>
  );
}
