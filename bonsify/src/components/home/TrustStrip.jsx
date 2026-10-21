import Image from "next/image";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { isClientVisible } from "@/lib/clients";
import styles from "./TrustStrip.module.css";

const brands = [
  { slug: "bachaparty", name: "BachaParty", icon: "/images/app-icons/Bachaa_Party.webp" },
  { slug: "highfy", name: "Highfy", icon: "/images/app-icons/HighFy.webp" },
];

export default function TrustStrip() {
  const visibleBrands = brands.filter((b) => isClientVisible(b.slug));
  if (visibleBrands.length === 0) return null;

  return (
    <section className={styles.strip}>
      <div className="wrap">
        <RevealOnScroll as="div" className={styles.row}>
          <span className={styles.label}>Live native apps, built and maintained by Bonsify</span>
          <div className={styles.brands}>
            {visibleBrands.map((b) => (
              <span className={styles.brand} key={b.name}>
                <Image
                  src={b.icon}
                  alt={`${b.name} app icon`}
                  width={22}
                  height={22}
                  className={styles.icon}
                />
                {b.name}
              </span>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
