import { buildRemoteBrand } from "../../../../scripts/lib/brand-record.mjs";

// Powers the "Fetch from store" button in /admin. Runs on Vercel as a normal
// serverless function (no VM): it reads the public store pages and returns the
// brand record as JSON. Nothing is saved here; the editor saves it to GitLab.
export const maxDuration = 60;

const PROJECT = process.env.GITLAB_PROJECT || "hamzaraza/bonsify.io";

// Only people who can push to the content repo may use it, checked with the
// same GitLab token the /admin editor already holds.
async function isTeamMember(token) {
  if (!token) return false;
  try {
    const r = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(PROJECT)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!r.ok) return false;
    const p = await r.json();
    const level = Math.max(p.permissions?.project_access?.access_level || 0, p.permissions?.group_access?.access_level || 0);
    return level >= 30; // Developer or above
  } catch {
    return false;
  }
}

// Plain public shop addresses only: no localhost, no IP literals, no internal names.
function safeUrl(input) {
  try {
    const u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (!/^https?:$/.test(u.protocol)) return null;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || /^\d+(\.\d+){3}$/.test(h) || h.includes(":") || /(^|\.)(local|localhost|internal|lan|home|corp)$/.test(h)) return null;
    return u.href;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!(await isTeamMember(token))) {
    return Response.json({ error: "Sign in to /admin first. Only the Bonsify team can fetch stores." }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a store URL." }, { status: 400 });
  }
  const url = safeUrl(String(body?.url || "").trim());
  if (!url) return Response.json({ error: "That does not look like a public store address." }, { status: 400 });

  try {
    const brand = await buildRemoteBrand(url, { name: body?.name || undefined });
    return Response.json({ brand });
  } catch (e) {
    return Response.json({ error: e.message || "Could not read that store." }, { status: 422 });
  }
}
