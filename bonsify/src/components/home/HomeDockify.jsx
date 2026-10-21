import Link from "next/link";
import styles from "./HomeServices.module.css";
import { isClientVisible } from "@/lib/clients";
import d from "./HomeDockify.module.css";

const SHOW_DOCKIFY = isClientVisible("dockify");
// Dockify, our Shopify app: turns mobile visits into home screen installs.
export default function HomeDockify() {
  if (!SHOW_DOCKIFY) return null;
  return (
    <section className={d.section} id="dockify">
      <div className={`wrap ${d.panel}`}>
        <div className={d.copy}>
          <p className={d.eyebrow}>Our Shopify app</p>
          <h2 className={styles.dockTitle}>Dockify.</h2>
          <p className={d.lede}>
            Not ready for a full app? Dockify invites mobile visitors to add your store to their home screen, rewards them with a discount code
            when they do, and tracks what those installs go on to buy.
          </p>
          <ul className={d.points}>
            <li>Install prompt that fits your theme</li>
            <li>Welcome code unlocked on install</li>
            <li>Install-to-purchase attribution</li>
          </ul>
          <Link className="btn btn-clay" href="/work/dockify">
            Explore Dockify
          </Link>
        </div>
        <div className={d.visual} aria-hidden="true">
          <div className={d.grid}>
            {Array.from({ length: 8 }, (_, n) => (
              <span key={n} className={n === 5 ? d.icon : ""} />
            ))}
          </div>
          <div className={d.toast}>
            <b>Your store added to home screen</b>
            Your code WELCOME10 is ready
          </div>
        </div>
      </div>
    </section>
  );
}
