"use client";

import { useEffect, useState } from "react";
import styles from "./Contact.module.css";

const OFFICES = [
  { id: "pk", city: "Karachi", zone: "Asia/Karachi", addr: "Building S4, NASTP-2, Office 18A, Shahra-e-Faisal, Karachi 75400" },
  { id: "us", city: "Santa Ana", zone: "America/Los_Angeles", addr: "1942 Blair Ave, Santa Ana, CA 92705" },
];

function read(zone) {
  const d = new Date();
  const time = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(d);
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", hour12: false }).format(d)) % 24;
  const day = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short" }).format(d);
  const weekend = day === "Sat" || day === "Sun";
  const awake = !weekend && hour >= 9 && hour < 19;
  return { time, awake, weekend };
}

/* Two offices, their local time, and whether someone is probably at a desk. */
export default function Clocks() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(Object.fromEntries(OFFICES.map((o) => [o.id, read(o.zone)])));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.clocks}>
      {OFFICES.map((o) => {
        const n = now?.[o.id];
        return (
          <div key={o.id} className={styles.office}>
            <div className={styles.officeTop}>
              <b>{o.city}</b>
              <span className={`${styles.dot} ${n?.awake ? styles.on : ""}`} aria-hidden="true" />
            </div>
            <p className={styles.time}>{n ? n.time : "\u00a0"}</p>
            <p className={styles.state}>{n ? (n.awake ? "Probably at a desk" : n.weekend ? "Weekend mode" : "Probably asleep") : "\u00a0"}</p>
            <address>{o.addr}</address>
          </div>
        );
      })}
    </div>
  );
}
