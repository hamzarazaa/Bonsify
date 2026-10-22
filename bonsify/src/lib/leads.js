// Client helpers for saving store addresses. Each address is kept on this
// device as well (so a failed network call can be retried) and sent to /api/lead.
const KEY = "bonsify_leads";

function keep(rec) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "[]");
    all.push({ ...rec, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(all.slice(-30)));
  } catch {}
}

export function saveLead(rec) {
  if (!rec.url && !rec.email) return Promise.resolve(false);
  keep(rec);
  const body = JSON.stringify(rec);
  try {
    if (rec.stage === "abandoned" && navigator.sendBeacon) {
      return Promise.resolve(navigator.sendBeacon("/api/lead", new Blob([body], { type: "application/json" })));
    }
  } catch {}
  return fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
    .then((r) => r.ok)
    .catch(() => false);
}

export const hostOf = (input) => {
  try {
    const u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const brandGuess = (input) => {
  const h = hostOf(input);
  if (!h) return "";
  const part = h.split(".")[0].replace(/[-_]+/g, " ");
  return part.replace(/\b\w/g, (c) => c.toUpperCase());
};
