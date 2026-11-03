"use client";

import { getProjectColor } from "@/lib/time-tracking/projects";
import { getPeriodNoun, type Report } from "@/lib/time-tracking/reports";
import { formatDuration, isSameDay } from "@/lib/time-tracking/time";
import type { Project, ReportPeriod } from "@/lib/time-tracking/types";

type ReportsSectionProps = {
  report: Report;
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  projects: Project[];
  today: Date;
};

export default function ReportsSection({
  report,
  period,
  onPeriodChange,
  projects,
  today,
}: ReportsSectionProps) {
  return (
    <section
      id="reports"
      className="mt-6 scroll-mt-6 rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Reports</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatDuration(report.totalSeconds)} worked this{" "}
            {getPeriodNoun(period)}
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
          {(["daily", "weekly", "monthly"] as const).map((option) => (
            <button
              key={option}
              onClick={() => onPeriodChange(option)}
              className={`rounded-md px-3 py-1 font-medium capitalize ${
                period === option
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 p-5 lg:grid-cols-5">
        {/* Daily hours */}
        <div className="lg:col-span-3">
          <h3 className="text-sm font-medium text-slate-700">Daily hours</h3>

          <div className="mt-4 flex h-48 items-end gap-1 border-b border-slate-200">
            {report.rows.map((row) => (
              <div
                key={row.date.toISOString()}
                className="flex h-full min-w-0 flex-1 flex-col justify-end"
                title={`${row.date.toLocaleDateString()}: ${formatDuration(
                  row.workedSeconds
                )}`}
              >
                <div
                  className={`w-full rounded-t ${
                    isSameDay(row.date, today)
                      ? "bg-indigo-500"
                      : "bg-indigo-200"
                  }`}
                  style={{
                    height:
                      report.maxSeconds > 0
                        ? `${(row.workedSeconds / report.maxSeconds) * 100}%`
                        : "0%",
                    minHeight: row.workedSeconds > 0 ? 2 : 0,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-1">
            {report.rows.map((row) => (
              <span
                key={row.date.toISOString()}
                className="min-w-0 flex-1 truncate text-center text-xs text-slate-500"
              >
                {row.label}
              </span>
            ))}
          </div>
        </div>

        {/* By project */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-700">By project</h3>

          {report.projectRows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No projects yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {report.projectRows.map((project) => {
                const percentage =
                  report.totalSeconds > 0
                    ? Math.round(
                        (project.workedSeconds / report.totalSeconds) * 100
                      )
                    : 0;

                const color = getProjectColor(projects, project.projectId);

                return (
                  <li key={project.projectId}>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="inline-flex min-w-0 items-center gap-2 font-medium text-slate-800">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                        <span className="truncate">{project.projectName}</span>
                      </span>

                      <span className="shrink-0 tabular-nums text-slate-500">
                        {formatDuration(project.workedSeconds)} · {percentage}%
                      </span>
                    </div>

                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
