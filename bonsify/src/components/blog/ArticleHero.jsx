import Link from "next/link";
import Image from "next/image";
import styles from "./ArticleHero.module.css";

export default function ArticleHero({ image, title, backHref, backLabel = "Back to Blog" }) {
  return (
    <div id="article-hero">
      {image?.src && (
        <section className={styles.hero} data-dark-hero>
          <Image
            src={image.src}
            alt={image.alt || title}
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </section>
      )}
      <div className={`${styles.titleBar} ${!image?.src ? styles.titleBarNoImage : ""}`}>
        <div className="wrap-narrow">
          <Link className={styles.back} href={backHref}>
            <svg viewBox="0 0 20 20" fill="none" className={styles.backIcon}>
              <path
                d="M12 4.5 6 10l6 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {backLabel}
          </Link>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>
    </div>
  );
}
