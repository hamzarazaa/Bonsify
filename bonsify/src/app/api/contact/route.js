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
    return Response.json(
      { error: "Could not send your message. Please try again or email us directly." },
      { status: 502 }
    );
  }

  if (!formspreeRes.ok) {
    return Response.json(
      { error: "Could not send your message. Please try again or email us directly." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
