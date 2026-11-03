"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import EntriesSection from "@/components/entries/EntriesSection";
import ReportsSection from "@/components/reports/ReportsSection";
import StatTiles from "@/components/reports/StatTiles";
import TimerCard from "@/components/timer/TimerCard";
import { useFaceCamera } from "@/hooks/useFaceCamera";
import { useTimeTracker } from "@/hooks/useTimeTracker";
import {
  buildReport,
  EMPTY_REPORT,
  getWorkedTotals,
} from "@/lib/time-tracking/reports";
import type { ReportPeriod, TimeEntry } from "@/lib/time-tracking/types";

export default function Home() {
  const camera = useFaceCamera();

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("weekly");

  const tracker = useTimeTracker({
    onLoad: (entries: TimeEntry[]) => {
      const runningEntry = entries.find((entry) => entry.endTime === null);

      if (runningEntry) {
        setSelectedProjectId(runningEntry.projectId);
      }

      camera.initialize(runningEntry !== undefined);
    },
  });

  const { timeEntries, projects, now } = tracker;

  // Before the clock is set there are no entries yet, so this placeholder
  // never reaches the screen; the date-based reports are skipped entirely.
  const clock = now ?? 0;
  const today = new Date(clock);

  const { todaySeconds, weekSeconds } = getWorkedTotals(timeEntries, clock);
  const report =
    now === null
      ? EMPTY_REPORT
      : buildReport(timeEntries, projects, reportPeriod, now);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Entries</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your time and review what you worked on.
            </p>
          </div>

          {now !== null && (
            <p className="text-sm text-slate-500">
              {today.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>

        <TimerCard
          tracker={tracker}
          camera={camera}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />

        <StatTiles
          todaySeconds={todaySeconds}
          weekSeconds={weekSeconds}
          isWorking={tracker.isWorking}
          report={report}
          reportPeriod={reportPeriod}
          projectCount={projects.length}
        />

        <EntriesSection
          timeEntries={timeEntries}
          projects={projects}
          now={clock}
          isBusy={tracker.isBusy}
          onSaveNotes={tracker.saveNotes}
        />

        <ReportsSection
          report={report}
          period={reportPeriod}
          onPeriodChange={setReportPeriod}
          projects={projects}
          today={today}
        />
      </main>
    </div>
  );
}
