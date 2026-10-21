import styles from "./BlogThumbnail.module.css";

const TOPICS = [
  {
    key: "retention",
    test: /retention|repeat|ltv|loyalty|churn/i,
    bg: "bone",
    render: () => (
      <svg viewBox="0 0 200 110" fill="none">
        <path
          d="M100 30a40 40 0 1 1-28 11.7"
          stroke="var(--jade)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M62 32 L72 41.7 L64 52"
          stroke="var(--jade)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="100" cy="70" r="4" fill="var(--clay)" />
      </svg>
    ),
  },
  {
    key: "push",
    test: /push notif|notification/i,
    bg: "sand",
    render: () => (
      <svg viewBox="0 0 200 110" fill="none">
        <circle cx="100" cy="55" r="6" fill="var(--clay)" />
        <circle
          cx="100"
          cy="55"
          r="20"
          stroke="var(--clay)"
          strokeWidth="2"
          opacity="0.55"
        />
        <circle
          cx="100"
          cy="55"
          r="34"
          stroke="var(--clay)"
          strokeWidth="2"
          opacity="0.3"
        />
        <circle
          cx="100"
          cy="55"
          r="48"
          stroke="var(--clay)"
          strokeWidth="2"
          opacity="0.15"
        />
      </svg>
    ),
  },
  {
    key: "product",
    test: /pwa|native app|webview|app store|aso|review timeline|launch timeline/i,
    bg: "bone",
    render: () => (
      <svg viewBox="0 0 200 110" fill="none">
        <rect
          x="82"
          y="15"
          width="36"
          height="80"
          rx="7"
          stroke="var(--ink)"
          strokeWidth="2.5"
        />
        <line x1="90" y1="27" x2="110" y2="27" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="90" y1="38" x2="106" y2="38" stroke="var(--moss)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="100" cy="86" r="2.6" fill="var(--jade)" />
      </svg>
    ),
  },
  {
    key: "comparison",
    test: /\bvs\b|versus|diy|migrat|hire it out|builder/i,
    bg: "sand",
    render: () => (
      <svg viewBox="0 0 200 110" fill="none">
        <rect x="52" y="30" width="34" height="60" rx="4" stroke="var(--jade)" strokeWidth="2.5" />
        <rect x="114" y="20" width="34" height="70" rx="4" stroke="var(--clay)" strokeWidth="2.5" />
        <line x1="100" y1="18" x2="100" y2="92" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.4" />
      </svg>
    ),
  },
  {
    key: "conversion",
    test: /conversion|convert|cost|cart abandon|benchmark/i,
    bg: "bone",
    render: () => (
      <svg viewBox="0 0 200 110" fill="none">
        <rect x="56" y="58" width="20" height="32" rx="2" fill="var(--moss)" />
        <rect x="90" y="40" width="20" height="50" rx="2" fill="var(--jade)" />
        <rect x="124" y="22" width="20" height="68" rx="2" fill="var(--clay)" />
        <line x1="48" y1="94" x2="152" y2="94" stroke="var(--ink)" strokeWidth="1.5" opacity="0.25" />
      </svg>
    ),
  },
  {
    key: "strategy",
    test: /.*/,
    bg: "sand",
    render: () => (
      <svg viewBox="0 0 200 110" fill="none">
        <path
          d="M40 80 C 70 30, 130 90, 160 35"
          stroke="var(--jade)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="40" cy="80" r="4.5" fill="var(--jade)" />
        <circle cx="160" cy="35" r="4.5" fill="var(--clay)" />
      </svg>
    ),
  },
];

export default function BlogThumbnail({ title }) {
  const topic = TOPICS.find((t) => t.test.test(title)) || TOPICS[TOPICS.length - 1];
  return (
    <div className={`${styles.thumb} ${styles[topic.bg]}`}>
      {topic.render()}
    </div>
  );
}
