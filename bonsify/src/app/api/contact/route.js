import { sendToSheet, formspreeOn } from "@/lib/leadSink";
import { recordEnquiry } from "@/lib/crm/intake";
import { autoReplyOn, contactReply, replyAllowed, sendAutoReply } from "@/lib/mail";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xlgyvadp";

// Cloudflare's published "always passes" test secret - matches the test
// site key used as ContactForm's fallback. Real deployments must set
// TURNSTILE_SECRET_KEY (see .env.example).
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

// The form posts here instead of straight to Formspree so the Turnstile
// token gets verified server-side before anything is forwarded - a token
// Formspree itself never checks isn't protecting against anything, it's
// just an extra unused field a bot's plain HTTP POST wouldn't even need to
// supply.
export async function POST(request) {
  const formData = await request.formData();

  // Honeypot field from the original form - a real visitor never sees or
  // fills it. Report success without doing anything so the bot doesn't
  // learn its submission was rejected.
  if (formData.get("_gotcha")) {
    return Response.json({ ok: true });
  }

  // Blank or junk submissions never reach the inbox.
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 3) {
    return Response.json(
      { error: "Please add your email and a short message." },
      { status: 400 }
    );
  }

  const token = formData.get("cf-turnstile-response");
  if (!token) {
    return Response.json(
      { error: "Please complete the verification check before sending." },
      { status: 400 }
    );
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY || TEST_SECRET_KEY;
  const verifyBody = new URLSearchParams();
  verifyBody.set("secret", secretKey);
  verifyBody.set("response", token);
  const ip = request.headers.get("x-forwarded-for");
  if (ip) verifyBody.set("remoteip", ip);

  let verifyData;
  try {
    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: verifyBody,
    });
    verifyData = await verifyRes.json();
  } catch {
    return Response.json(
      { error: "Could not verify the check. Please try again." },
      { status: 502 }
    );
  }

  if (!verifyData.success) {
    return Response.json(
      { error: "Verification failed. Please refresh and try again." },
      { status: 400 }
    );
  }

  const forwardBody = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (key === "cf-turnstile-response" || key === "_gotcha") continue;
    forwardBody.set(key, value);
  }

  // Messages sent from the lab copy of the site are tagged so they are easy
  // to tell apart in the inbox.
  if (process.env.NEXT_PUBLIC_LAB === "1") forwardBody.set("_subject", "[Bonsify lab] New message");

  const sheetSaved = sendToSheet({
    stage: "contact",
    name: String(formData.get("name") || ""),
    email,
    url: String(formData.get("store") || ""),
    message: `${formData.get("topic") ? `[${formData.get("topic")}] ` : ""}${message}`,
    source: "contact-form",
    site: process.env.NEXT_PUBLIC_LAB === "1" ? "lab" : "main",
  });

  // Also drop it into the Lead Centre when a store address was given. Never blocks or fails the form.
  const toCrm = async () => {
    const store = String(formData.get("store") || "");
    if (!store) return;
    await Promise.race([
      recordEnquiry({ kind: "contact", url: store, name: String(formData.get("name") || ""), email, phone: String(formData.get("phone") || ""), message, topic: String(formData.get("topic") || "") }),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  };

  // Optional automatic thank-you, off unless switched on in /admin (Settings).
  // Sent only once the message itself is safely received (see the returns below).
  const autoReply = async () => {
    if (autoReplyOn("autoEmailContactEnquiry") && replyAllowed(email, (ip || "unknown").split(",")[0].trim())) {
      await sendAutoReply(email, contactReply({ name: String(formData.get("name") || "") }));
    }
  };

  if (!formspreeOn()) {
    if (!(await sheetSaved)) {
      return Response.json({ error: "Could not send your message. Please try again or email us directly." }, { status: 502 });
    }
    await toCrm();
    await autoReply();
    return Response.json({ ok: true });
  }

  let formspreeRes;
  try {
    formspreeRes = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: forwardBody,
    });
  } catch {
    formspreeRes = null;
  }

  // One working copy is enough: the visitor only sees an error when neither the sheet nor Formspree took the message.
  if (!formspreeRes?.ok && !(await sheetSaved)) {
    return Response.json(
      { error: "Could not send your message. Please try again or email us directly." },
      { status: 502 }
    );
  }

  await toCrm();
  await autoReply();
  return Response.json({ ok: true });
}
