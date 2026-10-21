// Topic taxonomy derived from each post's title, since the markdown
// frontmatter doesn't carry an explicit category. Order matters: the first
// matching topic wins, so more specific topics are listed before the
// catch-all.
export const BLOG_TOPICS = [
  {
    key: "push",
    label: "Push & Engagement",
    test: /push|notif/i,
  },
  {
    key: "retention",
    label: "Retention & LTV",
    test: /retention|repeat|ltv|loyalty|churn/i,
  },
  {
    key: "comparison",
    label: "Comparisons",
    test: /\bvs\b|versus|migrat|\bdiy\b/i,
  },
  {
    key: "platform",
    label: "Platform & Build",
    test: /app store|\baso\b|review|launch|webview/i,
  },
  {
    key: "data",
    label: "Data & Benchmarks",
    test: /cost|convert|conversion|cart abandon|benchmark|attribution|increase sales/i,
  },
  {
    key: "strategy",
    label: "Strategy",
    test: /.*/,
  },
];

export function getBlogTopic(title) {
  return (
    BLOG_TOPICS.find((t) => t.test.test(title)) ||
    BLOG_TOPICS[BLOG_TOPICS.length - 1]
  );
}

export function getBlogTopicLabel(key) {
  return BLOG_TOPICS.find((t) => t.key === key)?.label || "Strategy";
}
