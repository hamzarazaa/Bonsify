import Link from "next/link";
import Image from "next/image";
import LabBranches from "@/components/lab/LabBranches";
import styles from "./PageHero.module.css";

export default function PageHero({
  breadcrumbs = [],
  title,
  lede,
  meta,
  image,
  imageFit = "cover",
  compactTitle = false,
}) {
  const hasImage = Boolean(image);

  return (
    <section className={`lab-hero ${styles.pageHero} ${!hasImage ? styles.noImage : ""}`} data-dark-hero={hasImage ? "" : undefined}>
      {/* Same folded-plane + sheen treatment as the homepage Hero, so this
          section reads as the same surface instead of a flat grey box. */}
      <div className={styles.fold} aria-hidden="true">
        <div className={styles.planeTop} />
        <div className={styles.planeBottom} />
        <div className={styles.creaseGlow} />
        <div className={styles.crease} />
        <div className={styles.sheen} />
      </div>

      {/* Full-bleed background image */}
      {hasImage && (
        <div className={styles.imageLayer}>
          <Image
            src={image.src}
            alt={image.alt || title}
            fill
            sizes="100vw"
            priority
            style={{
              objectFit: imageFit,
              objectPosition: "center",
            }}
          />
        </div>
      )}

      {/* Ambient atmosphere — diagonal vignette + edge glow */}
      <div className={styles.veil} aria-hidden="true">
        <div className={styles.veilGlow} />
      </div>

      <LabBranches seed={title} tone={hasImage ? undefined : "color-mix(in oklab, var(--jade) 80%, transparent)"} strength={hasImage ? 0.8 : 1.1} />

      {/* Content */}
      <div className={`wrap ${styles.inner}`}>
        {breadcrumbs.length > 0 && (
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.label} style={{ display: "contents" }}>
                {i > 0 && (
                  <span className={styles.sep} aria-hidden="true">/</span>
                )}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <h1
          className={`${styles.title} ${
            compactTitle ? styles.titleCompact : ""
          }`}
        >
          {title}
        </h1>

        {lede && <p className={styles.lede}>{lede}</p>}

        {meta && meta.length > 0 && (
          <dl className={styles.meta}>
            {meta.map((item) => (
              <div className={styles.metaItem} key={item.k}>
                <dt className={styles.metaKey}>{item.k}</dt>
                <dd className={styles.metaVal}>{item.v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}