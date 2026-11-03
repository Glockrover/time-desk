// Per-login camera flags, kept in sessionStorage so they survive reloads.
// All are cleared on sign-out.

// Set once face auto-start has fired or been dismissed, so it runs once per
// login rather than on every reload.
export const FACE_AUTO_START_KEY = "time-desk:face-auto-start-done";
// Set when the user turns the camera off while working.
export const FACE_PRESENCE_OFF_KEY = "time-desk:face-presence-off";
// Set while the current break was started because the user walked away, so
// only that break is resumed automatically when they come back.
export const AUTO_BREAK_KEY = "time-desk:auto-break";

export function readSessionFlag(key: string) {
  try {
    return sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function writeSessionFlag(key: string, on: boolean) {
  try {
    if (on) {
      sessionStorage.setItem(key, "1");
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable (e.g. private mode); the flag just resets.
  }
}

export function clearFaceCameraFlags() {
  for (const key of [FACE_AUTO_START_KEY, FACE_PRESENCE_OFF_KEY, AUTO_BREAK_KEY]) {
    writeSessionFlag(key, false);
  }
}
