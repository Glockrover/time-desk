import { getPeriodNoun, type Report } from "@/lib/time-tracking/reports";
import { formatDuration } from "@/lib/time-tracking/time";
import type { ReportPeriod } from "@/lib/time-tracking/types";

const WEEKLY_TARGET_HOURS = 40;

type StatTilesProps = {
  todaySeconds: number;
  weekSeconds: number;
  isWorking: boolean;
  report: Report;
  reportPeriod: ReportPeriod;
  projectCount: number;
};

export default function StatTiles({
  todaySeconds,
  weekSeconds,
  isWorking,
  report,
  reportPeriod,
  projectCount,
}: StatTilesProps) {
  const weekTargetPercent = Math.min(
    100,
    Math.round((weekSeconds / (WEEKLY_TARGET_HOURS * 3600)) * 100)
  );

  const tiles: {
    label: string;
    value: string;
    detail: string;
    progress?: number;
  }[] = [
    {
      label: "Today",
      value: formatDuration(todaySeconds),
      detail: isWorking ? "Includes the running session" : "Worked so far",
    },
    {
      label: "This week",
      value: formatDuration(weekSeconds),
      detail: `of ${WEEKLY_TARGET_HOURS}h target`,
      progress: weekTargetPercent,
    },
    {
      label: "Average per day",
      value: formatDuration(report.averageSeconds),
      detail: `${report.daysWorked} ${
        report.daysWorked === 1 ? "day" : "days"
      } worked this ${getPeriodNoun(reportPeriod)}`,
    },
    {
      label: "Active projects",
      value: String(report.activeProjectCount),
      detail: `of ${projectCount} ${projectCount === 1 ? "project" : "projects"}`,
    },
  ];

  return (
    <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <p className="text-sm font-medium text-slate-500">{tile.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {tile.value}
          </p>

          {tile.progress !== undefined && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${tile.progress}%` }}
              />
            </div>
          )}

          <p className="mt-2 text-xs text-slate-500">{tile.detail}</p>
        </div>
      ))}
    </section>
  );
}
