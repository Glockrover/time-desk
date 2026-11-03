import { getStartOfWeek, getWorkedSeconds, isSameDay, sumWorkedSeconds } from "./time";
import type { Project, ReportPeriod, TimeEntry } from "./types";

export type ReportRow = {
  date: Date;
  label: string;
  workedSeconds: number;
};

export type ProjectReportRow = {
  projectId: number;
  projectName: string;
  workedSeconds: number;
};

export type Report = {
  rows: ReportRow[];
  projectRows: ProjectReportRow[];
  totalSeconds: number;
  daysWorked: number;
  averageSeconds: number;
  maxSeconds: number;
  activeProjectCount: number;
};

// Shown before the first load, when there's no clock to build a report from.
export const EMPTY_REPORT: Report = {
  rows: [],
  projectRows: [],
  totalSeconds: 0,
  daysWorked: 0,
  averageSeconds: 0,
  maxSeconds: 0,
  activeProjectCount: 0,
};

export type EntryGroup = {
  key: string;
  date: Date;
  entries: TimeEntry[];
  workedSeconds: number;
};

export function getPeriodNoun(period: ReportPeriod) {
  return period === "daily" ? "day" : period === "weekly" ? "week" : "month";
}

// Time worked today and so far this week.
export function getWorkedTotals(entries: TimeEntry[], now: number) {
  const today = new Date(now);
  const startOfWeek = getStartOfWeek(today);

  return {
    todaySeconds: sumWorkedSeconds(
      entries.filter((entry) => isSameDay(new Date(entry.startTime), today)),
      now
    ),
    weekSeconds: sumWorkedSeconds(
      entries.filter((entry) => new Date(entry.startTime) >= startOfWeek),
      now
    ),
  };
}

// One row per day of the period containing `now`.
function getReportRows(
  entries: TimeEntry[],
  period: ReportPeriod,
  now: number
): ReportRow[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  let startDate: Date;
  let numberOfDays: number;

  if (period === "daily") {
    startDate = startOfToday;
    numberOfDays = 1;
  } else if (period === "weekly") {
    startDate = getStartOfWeek(startOfToday);
    numberOfDays = 7;
  } else {
    startDate = new Date(
      startOfToday.getFullYear(),
      startOfToday.getMonth(),
      1
    );

    numberOfDays = new Date(
      startOfToday.getFullYear(),
      startOfToday.getMonth() + 1,
      0
    ).getDate();
  }

  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      label:
        period === "monthly"
          ? String(date.getDate())
          : date.toLocaleDateString(undefined, { weekday: "short" }),
      workedSeconds: sumWorkedSeconds(
        entries.filter((entry) => isSameDay(new Date(entry.startTime), date)),
        now
      ),
    };
  });
}

function getProjectReportRows(
  entries: TimeEntry[],
  projects: Project[],
  rows: ReportRow[],
  now: number
): ProjectReportRow[] {
  if (rows.length === 0) {
    return [];
  }

  const startDate = new Date(rows[0].date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(rows[rows.length - 1].date);
  endDate.setHours(23, 59, 59, 999);

  return projects
    .map((project) => ({
      projectId: project.id,
      projectName: project.name,
      workedSeconds: sumWorkedSeconds(
        entries.filter((entry) => {
          const entryDate = new Date(entry.startTime);

          return (
            entry.projectId === project.id &&
            entryDate >= startDate &&
            entryDate <= endDate
          );
        }),
        now
      ),
    }))
    .sort((a, b) => b.workedSeconds - a.workedSeconds);
}

export function buildReport(
  entries: TimeEntry[],
  projects: Project[],
  period: ReportPeriod,
  now: number
): Report {
  const rows = getReportRows(entries, period, now);
  const projectRows = getProjectReportRows(entries, projects, rows, now);

  const totalSeconds = rows.reduce((total, row) => total + row.workedSeconds, 0);
  const daysWorked = rows.filter((row) => row.workedSeconds > 0).length;

  return {
    rows,
    projectRows,
    totalSeconds,
    daysWorked,
    averageSeconds: daysWorked > 0 ? Math.floor(totalSeconds / daysWorked) : 0,
    maxSeconds: Math.max(0, ...rows.map((row) => row.workedSeconds)),
    activeProjectCount: projectRows.filter((row) => row.workedSeconds > 0)
      .length,
  };
}

// Entries arrive newest first, so groups come out newest day first.
export function groupEntriesByDay(
  entries: TimeEntry[],
  now: number
): EntryGroup[] {
  const groups: EntryGroup[] = [];

  for (const entry of entries) {
    const date = new Date(entry.startTime);
    const key = date.toDateString();
    let group = groups.find((item) => item.key === key);

    if (!group) {
      group = { key, date, entries: [], workedSeconds: 0 };
      groups.push(group);
    }

    group.entries.push(entry);
    group.workedSeconds += getWorkedSeconds(entry, now);
  }

  return groups;
}
