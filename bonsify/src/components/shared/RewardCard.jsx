import { forwardRef } from "react";
import styles from "./RewardCard.module.css";

// Same figures as the real Dockify dashboard screenshot this replaces -
// as live numbers instead of tiny baked-in text, which was unreadable at
// this card's size.
const STATS = [
  { v: "10", l: "Installs" },
  { v: "8/2", l: "Android / iOS" },
  { v: "5", l: "Redeemed" },
  { v: "50%", l: "Conv. rate" },
];

const RewardCard = forwardRef(function RewardCard({ style }, ref) {
  return (
    <div className={styles.reward} ref={ref} style={style}>
      <p className={styles.title}>Every install, attributed</p>
      <div className={styles.grid}>
        {STATS.map((s) => (
          <div key={s.l}>
            <b>{s.v}</b>
            <span>{s.l}</span>
          </div>
        ))}
      </div>
      <p className={styles.caption}>Real installs from the Dockify dashboard</p>
    </div>
  );
});

export default RewardCard;
