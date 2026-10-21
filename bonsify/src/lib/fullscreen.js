"use client";
// Browser full screen, asked for on a click or tap. Some browsers (iPhone
// Safari) do not allow it for web pages, so every call fails quietly and the
// caller keeps its own full-viewport layout as the fallback.
export function canFullscreen() {
  if (typeof document === "undefined") return false;
  return Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
}

export function isFullscreen() {
  if (typeof document === "undefined") return false;
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

export async function enterFullscreen(el = document.documentElement) {
  try {
    const fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (fn) await fn.call(el, { navigationUI: "hide" });
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen() {
  try {
    if (!isFullscreen()) return;
    const fn = document.exitFullscreen || document.webkitExitFullscreen;
    if (fn) await fn.call(document);
  } catch {}
}

// Calls back whenever the browser enters or leaves full screen (including when
// the visitor presses Escape). Returns the unsubscribe function.
export function onFullscreenChange(cb) {
  const h = () => cb(isFullscreen());
  document.addEventListener("fullscreenchange", h);
  document.addEventListener("webkitfullscreenchange", h);
  return () => {
    document.removeEventListener("fullscreenchange", h);
    document.removeEventListener("webkitfullscreenchange", h);
  };
}
