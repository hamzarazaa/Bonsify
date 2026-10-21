import LabBranches from "@/components/lab/LabBranches";
import Link from "next/link";
import BrandMark from "@/components/shared/BrandMark";
import { featuredCompetitors, featuredAlternatives } from "@/lib/footerLinks";
import styles from "./Footer.module.css";

const featuredServices = [
  { slug: "mobile-app-development", title: "Mobile App Development" },
  { slug: "ios-app-development", title: "iOS App Development" },
  { slug: "android-app-development", title: "Android App Development" },
  { slug: "pwa-development", title: "PWA Development" },
  { slug: "app-maintenance-support", title: "App Maintenance & Support" },
  { slug: "custom-shopify-app-development", title: "Custom App Development" },
];

const featuredIndustries = [
  { slug: "fashion", title: "Fashion" },
  { slug: "beauty-cosmetics", title: "Beauty & Cosmetics" },
  { slug: "kids-baby", title: "Kids & Baby" },
  { slug: "food-beverage", title: "Food & Beverage" },
  { slug: "jewelry-accessories", title: "Jewelry & Accessories" },
  { slug: "streetwear-drops", title: "Streetwear & Drops" },
];

const featuredCompare = [...featuredCompetitors, ...featuredAlternatives];

export default function Footer() {
  return (
    <footer className={`lab-footer ${styles.footer}`}>
      <LabBranches seed="bonsify-footer" strength={0.7} />
      <div className="wrap">
        <div className={styles.top}>
          <div className={styles.col}>
            <div className={styles.brand}>
              <BrandMark />
              <span className={styles.name}>Bonsify</span>
            </div>
            <p>
              Done-for-you Shopify mobile apps. We take stores beyond the
              browser and onto the home screen.
            </p>
            <a href="mailto:hello@bonsify.io">hello@bonsify.io</a>
            <a href="tel:+12512779302">+1 (251) 277-9302</a>
          </div>

          <div className={styles.col}>
            <h3>Services</h3>
            {featuredServices.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`}>
                {s.title}
              </Link>
            ))}
            <Link href="/services" className={styles.viewAll}>
              View all services →
            </Link>
          </div>

          <div className={styles.col}>
            <h3>Industries</h3>
            {featuredIndustries.map((i) => (
              <Link key={i.slug} href={`/industries/${i.slug}`}>
                {i.title}
              </Link>
            ))}
            <Link href="/industries" className={styles.viewAll}>
              View all industries →
            </Link>
          </div>

          <div className={styles.col}>
            <h3>Compare</h3>
            {featuredCompare.map((c) => (
              <Link key={c.href} href={c.href}>
                {c.title}
              </Link>
            ))}
            <Link href="/vs" className={styles.viewAll}>
              All comparisons →
            </Link>
            <Link href="/alternatives" className={styles.viewAll}>
              All alternatives →
            </Link>
          </div>

          <div className={styles.col}>
            <h3>Company</h3>
            <Link href="/about">About</Link>
            <Link href="/how-we-work">How We Work</Link>
            <Link href="/work">Work</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            <address className={styles.address}>
              US: 1942 Blair Ave, Santa Ana, CA 92705
            </address>
            <address className={styles.address}>
              PK: Building S4, NASTP-2, Office 18A, Shahra-e-Faisal, Karachi 75400
            </address>
          </div>
        </div>
        <div className={styles.bottom}>
          <span className={styles.tag}>Beyond the browser.</span>
          <span className={styles.copy}>© 2026 Bonsify</span>
        </div>
      </div>
    </footer>
  );
}
