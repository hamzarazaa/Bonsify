// Starts and reads renders on the Google Cloud Run Job (crawl, deck PDF, video, publish).
// CRM_ENGINE_MOCK=1 fakes it for local tests (never in production).
import { googleToken } from "./gcp.js";

const GCP_PROJECT = process.env.GCP_PROJECT || "bonsify-engine";
const REGION = process.env.GCP_REGION || "us-central1";
export const JOB = process.env.ENGINE_JOB || "bonsify-engine";

export const engineMock = () => process.env.CRM_ENGINE_MOCK === "1" && process.env.NODE_ENV !== "production";

export async function startRun({ url, name, contact }) {
  if (engineMock()) return { execution: `${JOB}-mock${Date.now().toString(36)}` };
  const args = ["--url", url, "--name", name, ...(contact ? ["--contact", contact] : [])];
  const t = await googleToken();
  const r = await fetch(`https://run.googleapis.com/v2/projects/${GCP_PROJECT}/locations/${REGION}/jobs/${JOB}:run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ overrides: { containerOverrides: [{ args }] } }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || "Google refused the request.");
  const execution = j.metadata?.name?.split("/").pop();
  if (!execution) throw new Error("Started, but Google did not return a run id.");
  return { execution };
}

// -> { state: "running" | "done" | "failed" }
export async function runState(execution) {
  if (!new RegExp(`^${JOB}-[a-z0-9]+$`).test(String(execution))) throw new Error("Bad run id.");
  if (engineMock()) {
    const made = parseInt(String(execution).replace(`${JOB}-mock`, ""), 36);
    if (String(execution).includes("fail")) return { state: "failed" };
    return { state: Date.now() - made > 4000 ? "done" : "running" };
  }
  const t = await googleToken();
  const r = await fetch(`https://run.googleapis.com/v2/projects/${GCP_PROJECT}/locations/${REGION}/jobs/${JOB}/executions/${execution}`, { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || "Could not read the run.");
  return { state: j.succeededCount ? "done" : j.failedCount || j.cancelledCount ? "failed" : "running" };
}
