import crypto from "node:crypto";

// Starts and watches a render on the Google Cloud Run Job (crawl, video, deck PDF, publish).
// Only people who can push to the content repo may use it, checked with the same GitLab
// token the /admin editor already holds. The Google key lives only in Vercel env vars.
//   POST { url, name, contact? }  -> starts a run, returns { execution, slug }
//   GET  ?execution=<name>        -> { state: running | done | failed }
export const maxDuration = 30;

const PROJECT = process.env.GITLAB_PROJECT || "hamzaraza/bonsify.io";
const GCP_PROJECT = process.env.GCP_PROJECT || "bonsify-engine";
const REGION = process.env.GCP_REGION || "us-central1";
const JOB = process.env.ENGINE_JOB || "bonsify-engine";

async function isTeamMember(token) {
  if (!token) return false;
  try {
    const r = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(PROJECT)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!r.ok) return false;
    const p = await r.json();
    return Math.max(p.permissions?.project_access?.access_level || 0, p.permissions?.group_access?.access_level || 0) >= 30;
  } catch { return false; }
}

function safeUrl(input) {
  try {
    const u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (!/^https?:$/.test(u.protocol)) return null;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || /^\d+(\.\d+){3}$/.test(h) || h.includes(":") || /(^|\.)(local|localhost|internal|lan|home|corp)$/.test(h)) return null;
    return u.href;
  } catch { return null; }
}

const b64 = (b) => Buffer.from(b).toString("base64url");
async function googleToken() {
  const raw = process.env.GCP_SA_KEY;
  if (!raw) throw new Error("GCP_SA_KEY is not set on Vercel");
  const key = JSON.parse(raw);
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
  return j.access_token;
}

const bearer = (request) => (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
const deny = () => Response.json({ error: "Sign in to /admin first. Only the Bonsify team can start renders." }, { status: 401 });

export async function POST(request) {
  if (!(await isTeamMember(bearer(request)))) return deny();
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Send a store URL and a brand name." }, { status: 400 }); }
  const url = safeUrl(String(body?.url || "").trim());
  const name = String(body?.name || "").trim().slice(0, 80);
  const contact = String(body?.contact || "").trim().slice(0, 80);
  if (!url) return Response.json({ error: "That does not look like a public store address." }, { status: 400 });
  if (!name) return Response.json({ error: "Add the brand name." }, { status: 400 });
  const slug = name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) return Response.json({ error: "The brand name needs letters or numbers." }, { status: 400 });
  const args = ["--url", url, "--name", name, ...(contact ? ["--contact", contact] : [])];
  try {
    const t = await googleToken();
    const r = await fetch(`https://run.googleapis.com/v2/projects/${GCP_PROJECT}/locations/${REGION}/jobs/${JOB}:run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ overrides: { containerOverrides: [{ args }] } }),
    });
    const j = await r.json();
    if (!r.ok) return Response.json({ error: j.error?.message || "Google refused the request." }, { status: 502 });
    const execution = j.metadata?.name?.split("/").pop();
    if (!execution) return Response.json({ error: "Started, but Google did not return a run id." }, { status: 502 });
    return Response.json({ execution, slug });
  } catch (e) {
    return Response.json({ error: e.message || "Could not start the render." }, { status: 500 });
  }
}

export async function GET(request) {
  if (!(await isTeamMember(bearer(request)))) return deny();
  const ex = new URL(request.url).searchParams.get("execution") || "";
  if (!new RegExp(`^${JOB}-[a-z0-9]+$`).test(ex)) return Response.json({ error: "Bad run id." }, { status: 400 });
  try {
    const t = await googleToken();
    const r = await fetch(`https://run.googleapis.com/v2/projects/${GCP_PROJECT}/locations/${REGION}/jobs/${JOB}/executions/${ex}`, { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" });
    const j = await r.json();
    if (!r.ok) return Response.json({ error: j.error?.message || "Could not read the run." }, { status: 502 });
    const state = j.succeededCount ? "done" : j.failedCount || j.cancelledCount ? "failed" : "running";
    return Response.json({ state, started: j.startTime || null, finished: j.completionTime || null });
  } catch (e) {
    return Response.json({ error: e.message || "Could not read the run." }, { status: 500 });
  }
}
