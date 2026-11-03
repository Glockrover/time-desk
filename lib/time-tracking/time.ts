import type { BreakEntry, TimeEntry } from "./types";

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Midnight on the Monday of the given date's week.
export function getStartOfWeek(date: Date) {
  const startOfWeek = new Date(date);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));

  return startOfWeek;
}

export function calculateBreakSeconds(
  breaks: Pick<BreakEntry, "startTime" | "endTime">[],
  now: number
) {
  return breaks.reduce((total, breakEntry) => {
    const start = new Date(breakEntry.startTime).getTime();

    const end = breakEntry.endTime
      ? new Date(breakEntry.endTime).getTime()
      : now;

    const duration = Math.max(
      0,
      Math.floor((end - start) / 1000)
    );

    return total + duration;
  }, 0);
}

// Worked time for an entry, minus breaks. Running entries and breaks are
// measured up to `now`.
export function getWorkedSeconds(entry: TimeEntry, now: number) {
  const start = new Date(entry.startTime).getTime();
  const end = entry.endTime
    ? new Date(entry.endTime).getTime()
    : now;

  const elapsedSeconds = Math.floor((end - start) / 1000);
  const breakSeconds = calculateBreakSeconds(entry.breaks, end);

  return Math.max(0, elapsedSeconds - breakSeconds);
}

export function sumWorkedSeconds(entries: TimeEntry[], now: number) {
  return entries.reduce(
    (total, entry) => total + getWorkedSeconds(entry, now),
    0
  );
}

// Clock format for the live timer and CSV export, e.g. 01:05:09.
export function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

// Compact format for totals, e.g. 6h 30m.
export function formatDuration(totalSeconds: number) {
  if (totalSeconds > 0 && totalSeconds < 60) {
    return "<1m";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function formatClockTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getDayLabel(date: Date, today: Date) {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
