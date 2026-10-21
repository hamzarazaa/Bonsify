"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import styles from "./WorkImpact.module.css";

const ArrowIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className={styles.arrowIcon}>
    <path
      d="M2 7h10M8 3l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function WorkImpact({ cards }) {
  const [openCard, setOpenCard] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const alwaysOpen = cards.length <= 1 || isMobile;

  return (
    <div className={styles.row}>
      {cards.map((card, idx) => {
        const isOpen = alwaysOpen || openCard === idx;

        return (
          <motion.div
            key={card.slug}
            onMouseEnter={() => !alwaysOpen && setOpenCard(idx)}
            onFocus={() => !alwaysOpen && setOpenCard(idx)}
            animate={alwaysOpen ? undefined : { flex: isOpen ? 4.4 : 1.4 }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className={`${styles.card} ${styles[card.accent]}`}
            style={alwaysOpen ? { flex: 1 } : undefined}
            tabIndex={0}
          >
            <Link href={card.href} className={styles.cardLink}>
              {isOpen ? (
                <div
                  className={`${styles.expanded} ${
                    card.imageOrientation === "portrait"
                      ? styles.expandedPortrait
                      : ""
                  }`}
                >
                  <div className={styles.textCol}>
                    <div className={styles.expandedHead}>
                      {card.icon && (
                        <Image
                          src={card.icon}
                          alt=""
                          width={40}
                          height={40}
                          className={styles.icon}
                        />
                      )}
                      <span className={styles.word}>{card.word}</span>
                    </div>

                    <div className={styles.expandedBody}>
                      <p className={styles.tag}>{card.tag}</p>
                      <h3 className={styles.title}>{card.title}</h3>
                      <p className={styles.desc}>{card.desc}</p>
                      <span className={styles.more}>
                        {card.more}
                        <ArrowIcon />
                      </span>
                    </div>
                  </div>

                  <div
                    className={`${styles.shot} ${
                      card.imageOrientation === "portrait"
                        ? styles.shotPortrait
                        : ""
                    }`}
                  >
                    <Image
                      src={card.image}
                      alt={card.word}
                      fill
                      className={styles.shotImg}
                      sizes={
                        card.imageOrientation === "portrait"
                          ? "(max-width: 760px) 100vw, 190px"
                          : "(max-width: 760px) 100vw, 40vw"
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.collapsed}>
                  {card.icon && (
                    <Image
                      src={card.icon}
                      alt=""
                      width={36}
                      height={36}
                      className={styles.icon}
                    />
                  )}
                  <div className={styles.collapsedLabel}>
                    <span className={styles.word}>{card.word}</span>
                    <span className={styles.collapsedTag}>{card.tag}</span>
                  </div>
                </div>
              )}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
