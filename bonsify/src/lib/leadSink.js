// Writes a lead to the "Bonsify leads" Google Sheet through a small Apps Script
// web app (LEADS_WEBHOOK_URL and LEADS_WEBHOOK_SECRET). Server-side only. Never throws,
// so a sheet problem can't break a form. Returns true when the sheet accepted it.
export async function sendToSheet(rec) {
  const url = process.env.LEADS_WEBHOOK_URL;
  const secret = process.env.LEADS_WEBHOOK_SECRET;
  if (!url || !secret) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script reads the raw body
      body: JSON.stringify({ ...rec, secret }),
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const j = await res.json().catch(() => ({}));
    return !!j.ok;
  } catch {
    return false;
  }
}

// Formspree stays on as a second copy unless this is "0".
export const formspreeOn = () => process.env.LEADS_FORMSPREE !== "0";
