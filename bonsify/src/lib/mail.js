// Sends the short automatic replies to people who write to us. Server-side only.
//
// Plain SMTP through nodemailer (Zoho Mail). Nothing is sent unless SMTP_USER
// and SMTP_PASS are set, so missing settings can never break a form.
//   SMTP_HOST      default smtp.zoho.com (EU accounts: smtp.zoho.eu, India: smtp.zoho.in)
//   SMTP_PORT      default 465 (SSL). 587 uses STARTTLS.
//   SMTP_USER      the mailbox login, hello@bonsify.io
//   SMTP_PASS      its password, or an app-specific password when 2FA is on
//   MAIL_FROM      default "Bonsify <hello@bonsify.io>". Zoho only lets you send as
//                  the logged-in mailbox or one of its aliases.
//   MAIL_REPLY_TO  default hello@bonsify.io
// All are read when a request arrives, never baked into the build.
//
// The two on/off switches live in content/settings/emails.json and are edited
// in /admin under Settings. The file is bundled at build time, and a change in
// /admin is a commit, so the new value goes live when Vercel redeploys.
import nodemailer from "nodemailer";
import settings from "../../content/settings/emails.json";


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

// Never throws. Returns true when the server accepted the message. Callers await
// it so the work finishes before the serverless function is frozen; the timeouts
// keep a slow mail server from holding the form up for long.
export async function sendAutoReply(to, { subject, lines }) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.log("BONSIFY_AUTOREPLY_SKIPPED no SMTP_USER or SMTP_PASS");
    return false;
  }
  try {
    const port = Number(process.env.SMTP_PORT) || 465;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.zoho.com",
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM || "Bonsify <hello@bonsify.io>",
      to,
      replyTo: process.env.MAIL_REPLY_TO || "hello@bonsify.io",
      subject,
      text: lines.join("\n\n"),
      html: lines.map((l) => `<p>${esc(l)}</p>`).join(""),
      headers: { "Auto-Submitted": "auto-replied" },
    });
    transport.close();
    return true;
  } catch (e) {
    console.log("BONSIFY_AUTOREPLY_FAILED " + (e?.code || e?.message || "error"));
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
