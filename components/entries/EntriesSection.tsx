"use client";

import { useState } from "react";
import EntryRow from "@/components/entries/EntryRow";
import { groupEntriesByDay } from "@/lib/time-tracking/reports";
import { formatDuration, getDayLabel } from "@/lib/time-tracking/time";
import { buildTimesheetCsv, downloadCsv } from "@/lib/time-tracking/timesheet";
import type { Project, TimeEntry } from "@/lib/time-tracking/types";

type EntriesSectionProps = {
  timeEntries: TimeEntry[];
  projects: Project[];
  now: number;
  isBusy: boolean;
  // Resolves to true once the notes are saved.
  onSaveNotes: (entryId: number, notes: string) => Promise<boolean | undefined>;
};

export default function EntriesSection({
  timeEntries,
  projects,
  now,
  isBusy,
  onSaveNotes,
}: EntriesSectionProps) {
  const [filterProjectId, setFilterProjectId] = useState("all");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

  const completedEntries = timeEntries
    .filter((entry) => entry.endTime !== null)
    .filter(
      (entry) =>
        filterProjectId === "all" ||
        String(entry.projectId) === filterProjectId
    );

  const entryGroups = groupEntriesByDay(completedEntries, now);
  const today = new Date(now);

  const exportTimesheet = () => {
    if (completedEntries.length === 0) {
      alert("There are no completed sessions to export.");
      return;
    }

    downloadCsv(
      buildTimesheetCsv(completedEntries, projects, now),
      `timesheet-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <section
      id="entries"
      className="mt-6 scroll-mt-6 rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold">Time entries</h2>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="filterProject">
            Filter by project
          </label>
          <select
            id="filterProject"
            value={filterProjectId}
            onChange={(event) => setFilterProjectId(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All projects</option>

            {projects.map((project) => (
              <option key={project.id} value={String(project.id)}>
                {project.name}
              </option>
            ))}
          </select>

          <button
            onClick={exportTimesheet}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {entryGroups.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-500">
          {filterProjectId === "all"
            ? "No completed entries yet. Start the timer to log your first one."
            : "No completed entries for this project."}
        </p>
      ) : (
        entryGroups.map((group) => (
          <div key={group.key}>
            <div className="flex items-center justify-between bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>{getDayLabel(group.date, today)}</span>
              <span className="tabular-nums">
                {formatDuration(group.workedSeconds)}
              </span>
            </div>

            <ul className="divide-y divide-slate-100">
              {group.entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  projects={projects}
                  now={now}
                  isEditing={editingEntryId === entry.id}
                  isBusy={isBusy}
                  onEdit={() => setEditingEntryId(entry.id)}
                  onCancelEdit={() => setEditingEntryId(null)}
                  onSaveNotes={async (notes) => {
                    if (await onSaveNotes(entry.id, notes)) {
                      setEditingEntryId(null);
                    }
                  }}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
