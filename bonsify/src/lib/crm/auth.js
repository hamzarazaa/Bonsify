// Same check as the /admin "Fetch from store" button: the caller must be able to push to the content repo.
const PROJECT = process.env.GITLAB_PROJECT || "hamzaraza/bonsify.io";

export async function teamMember(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  if (process.env.CRM_DEV_BYPASS === "1" && process.env.NODE_ENV !== "production") return { name: "Dev", username: "dev" };
  try {
    const h = { Authorization: `Bearer ${token}` };
    const r = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(PROJECT)}`, { headers: h, cache: "no-store" });
    if (!r.ok) return null;
    const p = await r.json();
    const level = Math.max(p.permissions?.project_access?.access_level || 0, p.permissions?.group_access?.access_level || 0);
    if (level < 30) return null;
    const u = await fetch("https://gitlab.com/api/v4/user", { headers: h, cache: "no-store" }).then((x) => (x.ok ? x.json() : {})).catch(() => ({}));
    return { name: u.name || u.username || "", username: u.username || "" };
  } catch { return null; }
}
