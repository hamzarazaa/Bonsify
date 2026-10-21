import Image from "next/image";
import styles from "./LaptopMockup.module.css";

export default function LaptopMockup({ src, alt, caption, width = 1400, height = 860 }) {
  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <div className={styles.chrome}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.url} />
        </div>
        <div className={styles.screen}>
          <Image src={src} alt={alt} width={width} height={height} />
        </div>
      </div>
      <div className={styles.stand} />
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
