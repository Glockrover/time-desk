import { Temporal } from "@js-temporal/polyfill";

// The database client reads and writes timestamps through the global Temporal
// API, and the API routes call Temporal.Now directly. Newer Node versions ship
// Temporal; older ones (including Vercel's runtime) don't, so install the
// polyfill there. Import this before anything that touches the database.
if (typeof globalThis.Temporal === "undefined") {
  Object.defineProperty(globalThis, "Temporal", {
    value: Temporal,
    writable: true,
    configurable: true,
  });
}
