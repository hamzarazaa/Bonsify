import styles from "./BlogCover.module.css";

// Per-topic cover art: a mood (dark ink vs. light bone/sand), a glow blob,
// and a small line-art mark. Built entirely from the site's own color
// tokens so every card reads as one system instead of mismatched stock
// photography.
const COVERS = {
  push: {
    mood: "dark",
    glow: "clay",
    render: () => (
      <svg viewBox="0 0 200 130" fill="none">
        <circle cx="100" cy="63" r="6" fill="var(--clay-on-dark)" />
        <circle cx="100" cy="63" r="22" stroke="var(--clay-on-dark)" strokeWidth="2" opacity="0.6" />
        <circle cx="100" cy="63" r="38" stroke="var(--bone)" strokeWidth="1.5" opacity="0.35" />
        <circle cx="100" cy="63" r="54" stroke="var(--bone)" strokeWidth="1.5" opacity="0.16" />
      </svg>
    ),
  },
  retention: {
    mood: "light",
    glow: "jade",
    render: () => (
      <svg viewBox="0 0 200 130" fill="none">
        <path
          d="M100 40a35 35 0 1 1-24.7 10.3"
          stroke="var(--jade)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M68 42 L76.7 50.3 L69.6 60"
          stroke="var(--jade)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="100" cy="75" r="4.5" fill="var(--clay)" />
      </svg>
    ),
  },
  comparison: {
    mood: "dark",
    glow: "jade",
    render: () => (
      <svg viewBox="0 0 200 130" fill="none">
        <rect x="60" y="46" width="30" height="52" rx="4" stroke="var(--jade)" strokeWidth="2.5" />
        <rect x="110" y="32" width="30" height="66" rx="4" stroke="var(--clay-on-dark)" strokeWidth="2.5" />
        <line x1="100" y1="24" x2="100" y2="106" stroke="var(--bone)" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.4" />
      </svg>
    ),
  },
  platform: {
    mood: "light",
    glow: "moss",
    render: () => (
      <svg viewBox="0 0 200 130" fill="none">
        <rect x="82" y="24" width="36" height="82" rx="8" stroke="var(--ink)" strokeWidth="2.5" />
        <line x1="90" y1="37" x2="110" y2="37" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="90" y1="48" x2="106" y2="48" stroke="var(--moss)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="90" y1="59" x2="112" y2="59" stroke="var(--clay)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="100" cy="96" r="2.8" fill="var(--jade)" />
      </svg>
    ),
  },
  data: {
    mood: "light",
    glow: "clay",
    render: () => (
      <svg viewBox="0 0 200 130" fill="none">
        <rect x="58" y="70" width="20" height="34" rx="2" fill="var(--moss)" />
        <rect x="90" y="50" width="20" height="54" rx="2" fill="var(--jade)" />
        <rect x="122" y="30" width="20" height="74" rx="2" fill="var(--clay)" />
        <line x1="50" y1="108" x2="150" y2="108" stroke="var(--ink)" strokeWidth="1.5" opacity="0.25" />
      </svg>
    ),
  },
  strategy: {
    mood: "dark",
    glow: "moss",
    render: () => (
      <svg viewBox="0 0 200 130" fill="none">
        <path
          d="M42 92 C 74 40, 128 100, 158 42"
          stroke="var(--jade)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="42" cy="92" r="5" fill="var(--clay-on-dark)" />
        <circle cx="158" cy="42" r="5" fill="var(--clay-on-dark)" />
      </svg>
    ),
  },
};

export default function BlogCover({ topicKey, size = "md" }) {
  const cover = COVERS[topicKey] || COVERS.strategy;
  return (
    <div className={`${styles.cover} ${styles[cover.mood]} ${styles[size]}`}>
      <span
        className={styles.glow}
        style={{ "--glow-color": `var(--${cover.glow})` }}
      />
      <span className={styles.grain} />
      {cover.render()}
    </div>
  );
}
