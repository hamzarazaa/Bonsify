// Sends the short automatic replies to people who write to us. Server-side only.
//
// Provider: Resend's HTTP API (no package needed). Nothing is sent unless
// RESEND_API_KEY is set, so a missing key can never break a form.
//   MAIL_FROM      sender, default "Bonsify <hello@bonsify.io>"
//   MAIL_REPLY_TO  where replies go, default hello@bonsify.io
//   RESEND_API_KEY from resend.com once the bonsify.io domain is verified there
//
// The two on/off switches live in content/settings/emails.json and are edited
// in /admin under Settings. The file is bundled at build time, and a change in
// /admin is a commit, so the new value goes live when Vercel redeploys.
import settings from "../../content/settings/emails.json";

export const MAIL_FROM = process.env.MAIL_FROM || "Bonsify <hello@bonsify.io>";
export const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || "hello@bonsify.io";

// Strictly true turns it on, so a missing or odd value stays off.
export const autoReplyOn = (key) => settings?.[key] === true;

const firstName = (name) => {
  const n = String(name || "").trim().split(/\s+/)[0] || "";
  return n.replace(/[<>&"]/g, "").slice(0, 40);
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Plain wording. No dashes used as punctuation, no sales language.
export function homeReply({ name, brandName, url }) {
  const hi = firstName(name) ? `Hi ${firstName(name)},` : "Hi,";
  const store = brandName || url;
  const lines = [
    hi,
    store
      ? `Thanks for sending us ${store}. We got it, and one of us will look at your store and write back to you personally.`
      : "Thanks for getting in touch. We got your details, and one of us will write back to you personally.",
    "If you want to add anything in the meantime, just reply to this email.",
    "The Bonsify team",
  ];
  return { subject: "We got your store", lines };
}

export function contactReply({ name }) {
  const hi = firstName(name) ? `Hi ${firstName(name)},` : "Hi,";
  return {
    subject: "We got your message",
    lines: [
      hi,
      "Thanks for writing to Bonsify. Your message has reached us, and a real person will read it and reply as soon as they can.",
      "If you think of something else to add, reply to this email and it will land with the same person.",
      "The Bonsify team",
    ],
  };
}

// Never throws. Returns true when the provider accepted the message.
export async function sendAutoReply(to, { subject, lines }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("BONSIFY_AUTOREPLY_SKIPPED no RESEND_API_KEY");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [to],
        reply_to: MAIL_REPLY_TO,
        subject,
        text: lines.join("\n\n"),
        html: lines.map((l) => `<p>${esc(l)}</p>`).join(""),
        headers: { "Auto-Submitted": "auto-replied" },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.log("BONSIFY_AUTOREPLY_FAILED " + res.status);
    return res.ok;
  } catch (e) {
    console.log("BONSIFY_AUTOREPLY_FAILED " + (e?.message || "error"));
    return false;
  }
}

// Stops the two public forms being used to mail strangers: at most 2 replies
// per address and 6 per visitor address per hour, per server instance.
const sent = new Map();
export function replyAllowed(email, ip) {
  const now = Date.now();
  const keep = (k) => (sent.get(k) || []).filter((t) => now - t < 3_600_000);
  const a = keep(`e:${email.toLowerCase()}`);
  const b = keep(`i:${ip}`);
  if (a.length >= 2 || b.length >= 6) return false;
  a.push(now);
  b.push(now);
  sent.set(`e:${email.toLowerCase()}`, a);
  sent.set(`i:${ip}`, b);
  if (sent.size > 1000) for (const [k, v] of sent) if (!v.some((t) => now - t < 3_600_000)) sent.delete(k);
  return true;
}
