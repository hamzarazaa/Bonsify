import crypto from "node:crypto";

// Google sign-in for server code (Vercel functions), using the service account key in GCP_SA_KEY.
// Vercel's text box can turn the key's \n into real line breaks (or add quotes), which breaks JSON.parse.
// Accept the JSON as pasted, base64 of it, or the same with broken line breaks.
export function parseKey(raw) {
  let t = String(raw).trim();
  if (t.startsWith('"') && t.endsWith('"')) { try { t = JSON.parse(t); } catch { t = t.slice(1, -1); } }
  if (!t.startsWith("{") && /^[A-Za-z0-9+/=\s]+$/.test(t)) { try { t = Buffer.from(t, "base64").toString("utf8"); } catch {} }
  try { return JSON.parse(t); } catch {}
  const email = t.match(/"client_email"\s*:\s*"([^"]+)"/)?.[1];
  const pem = t.match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/)?.[0];
  if (!email || !pem) throw new Error("GCP_SA_KEY on Vercel is not a valid service account key");
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\\n|\s/g, "");
  return { client_email: email, private_key: `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g).join("\n")}\n-----END PRIVATE KEY-----\n` };
}

const b64 = (b) => Buffer.from(b).toString("base64url");
let cached = null; // { token, exp }

export async function googleToken() {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const raw = process.env.GCP_SA_KEY;
  if (!raw) throw new Error("GCP_SA_KEY is not set on Vercel");
  const key = parseKey(raw);
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64(JSON.stringify({ iss: key.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 }));
  const sig = crypto.sign("RSA-SHA256", Buffer.from(`${head}.${claim}`), key.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error("Google sign-in failed");
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in || 3000) * 1000 };
  return cached.token;
}
