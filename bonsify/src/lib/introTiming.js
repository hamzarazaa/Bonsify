// Shared choreography timings for the homepage load-in: the full-viewport
// shader splash (HomeSplash) and the hero's phone reveal (Hero) are separate
// components that never talk to each other directly - they each schedule
// their own timers off their own mount time, reading these same constants,
// so the two stay in lockstep without prop-drilling or an event bus.
export const SPLASH_HOLD_MS = 2200; // shader + wordmark visible before opening
export const SPLASH_OPEN_MS = 900; // curtain-panel slide-apart duration
export const PHONE_REVEAL_MS = 1100; // phone's center-to-slot move + flip-in
