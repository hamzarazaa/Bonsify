import Image from "next/image";
import styles from "./BlogHero.module.css";

export default function BlogHero() {
  return (
    <section className={styles.hero} data-dark-hero>
      <Image
        src="/images/BlogHero.jpg"
        alt="Bonsify blog"
        fill
        sizes="100vw"
        priority
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
    </section>
  );
}
