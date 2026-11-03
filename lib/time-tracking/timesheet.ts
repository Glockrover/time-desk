import { getProjectName } from "./projects";
import { formatTime, getWorkedSeconds } from "./time";
import type { Project, TimeEntry } from "./types";

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildTimesheetCsv(
  entries: TimeEntry[],
  projects: Project[],
  now: number
) {
  const rows = [
    ["Project", "Start Time", "End Time", "Worked Duration", "Notes"],
    ...entries.map((entry) => [
      getProjectName(projects, entry.projectId),
      new Date(entry.startTime).toLocaleString(),
      entry.endTime
        ? new Date(entry.endTime).toLocaleString()
        : "",
      formatTime(getWorkedSeconds(entry, now)),
      entry.notes ?? "",
    ]),
  ];

  return rows
    .map((row) => row.map((value) => escapeCsv(String(value))).join(","))
    .join("\r\n");
}

export function downloadCsv(csv: string, filename: string) {
  // The BOM makes Excel open the file as UTF-8.
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
