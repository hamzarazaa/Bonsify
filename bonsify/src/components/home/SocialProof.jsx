import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { isClientVisible } from "@/lib/clients";
import styles from "./SocialProof.module.css";

const AppStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 12.04c-.02-2.05 1.68-3.03 1.75-3.08-0.95-1.4-2.44-1.59-2.97-1.61-1.26-.13-2.47.74-3.11.74-.64 0-1.63-.72-2.68-.7-1.38.02-2.65.8-3.36 2.03-1.43 2.49-.37 6.17 1.03 8.19.68.99 1.49 2.1 2.56 2.06 1.03-.04 1.42-.67 2.66-.67 1.24 0 1.59.67 2.68.65 1.11-.02 1.81-1.01 2.49-2 .78-1.15 1.11-2.26 1.13-2.32-.02-.01-2.17-.83-2.19-3.31zM15.3 6.13c.57-.69.95-1.65.85-2.6-.82.03-1.81.54-2.4 1.23-.53.61-.99 1.59-.86 2.52.91.07 1.84-.46 2.41-1.15z" />
  </svg>
);

const PlayStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.2 3.3c-.2.2-.3.5-.3.9v15.6c0 .4.1.7.3.9l.1.1 8.7-8.7v-.2L4.2 3.3zM16.5 15.3l-2.9-2.9-8.7 8.7c.3.3.8.3 1.3.1l10.3-5.9zM20.4 10.9l-2.6-1.5-3.2 3.2 3.2 3.2 2.6-1.5c.9-.5.9-1.9 0-2.4zM4.9 3.2l8.7 5 2.9-2.9L6.2 2.4c-.5-.3-1-.3-1.3.1z" />
  </svg>
);

const proofs = [
  {
    slug: "bachaparty",
    name: "BachaParty",
    icon: "/images/app-icons/Bachaa_Party.webp",
    tag: "Fashion",
    desc: "A full fashion catalog turned into a native shopping app - browse, cart, and checkout without ever opening a browser.",
    path: "/work/bachaparty",
    url: "https://bachaaparty.com",
  },
  {
    slug: "highfy",
    name: "Highfy",
    icon: "/images/app-icons/HighFy.webp",
    tag: "Retail",
    desc: "A native app built to keep customers coming back - push-ready, fast, and installed right on the home screen.",
    path: "/work/highfy",
    url: "https://highfy.pk",
  },
];

export default function SocialProof() {
  const visibleProofs = proofs.filter((p) => isClientVisible(p.slug));
  if (visibleProofs.length === 0) return null;

  return (
    <section className="section section-bone" id="work">
      <div className="wrap">
        <div className={styles.head}>
          <RevealOnScroll as="span" className="eyebrow">
            Proof
          </RevealOnScroll>
          <RevealOnScroll as="h2">Live on the store today</RevealOnScroll>
          <RevealOnScroll as="p">
            Built, launched, and maintained end to end.
          </RevealOnScroll>
        </div>
        <div
          className={`${styles.grid} ${
            visibleProofs.length === 1 ? styles.gridSingle : ""
          }`}
        >
          {visibleProofs.map((p) => (
            <RevealOnScroll as="div" className={styles.card} key={p.name}>
              <Link href={p.path} className={styles.cardLink}>
                <div className={styles.top}>
                  <div className={styles.brandRow}>
                    <Image
                      className={styles.icon}
                      src={p.icon}
                      alt={`${p.name} app icon`}
                      width={36}
                      height={36}
                    />
                    <span className={styles.logo}>{p.name}</span>
                  </div>
                  <span className={styles.tag}>{p.tag}</span>
                </div>
                <p className={styles.desc}>{p.desc}</p>
                <span className={styles.more}>View case study →</span>
              </Link>
              <div className={styles.badges}>
                <a
                  className={styles.badge}
                  href={p.url}
                  target="_blank"
                  rel="noopener"
                >
                  <AppStoreIcon />
                  <span className={styles.bt}>
                    <span className={styles.s}>Download on the</span>
                    <span className={styles.l}>App Store</span>
                  </span>
                </a>
                <a
                  className={styles.badge}
                  href={p.url}
                  target="_blank"
                  rel="noopener"
                >
                  <PlayStoreIcon />
                  <span className={styles.bt}>
                    <span className={styles.s}>Get it on</span>
                    <span className={styles.l}>Google Play</span>
                  </span>
                </a>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
