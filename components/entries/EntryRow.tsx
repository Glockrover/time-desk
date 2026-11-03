"use client";

import { useState } from "react";
import { getProjectColor, getProjectName } from "@/lib/time-tracking/projects";
import {
  calculateBreakSeconds,
  formatClockTime,
  formatDuration,
  getWorkedSeconds,
} from "@/lib/time-tracking/time";
import type { Project, TimeEntry } from "@/lib/time-tracking/types";

type EntryRowProps = {
  entry: TimeEntry;
  projects: Project[];
  now: number;
  isEditing: boolean;
  isBusy: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveNotes: (notes: string) => void;
};

export default function EntryRow({
  entry,
  projects,
  now,
  isEditing,
  isBusy,
  onEdit,
  onCancelEdit,
  onSaveNotes,
}: EntryRowProps) {
  const breakSeconds = calculateBreakSeconds(entry.breaks, now);

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm ${
              entry.notes
                ? "font-medium text-slate-900"
                : "italic text-slate-400"
            }`}
          >
            {entry.notes || "No description"}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span
                className={`h-2 w-2 rounded-full ${getProjectColor(
                  projects,
                  entry.projectId
                )}`}
              />
              {getProjectName(projects, entry.projectId)}
            </span>

            <span className="tabular-nums">
              {formatClockTime(entry.startTime)} –{" "}
              {entry.endTime && formatClockTime(entry.endTime)}
            </span>

            {breakSeconds > 0 && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                {formatDuration(breakSeconds)} break
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
            {formatDuration(getWorkedSeconds(entry, now))}
          </span>

          {!isEditing && (
            <button
              onClick={onEdit}
              className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <NotesEditor
          initialNotes={entry.notes ?? ""}
          isBusy={isBusy}
          onSave={onSaveNotes}
          onCancel={onCancelEdit}
        />
      )}
    </li>
  );
}

type NotesEditorProps = {
  initialNotes: string;
  isBusy: boolean;
  onSave: (notes: string) => void;
  onCancel: () => void;
};

function NotesEditor({ initialNotes, isBusy, onSave, onCancel }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);

  return (
    <div className="mt-3">
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Describe what you worked on..."
        rows={2}
        maxLength={2000}
        className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />

      <div className="mt-2 flex gap-2">
        <button
          onClick={() => onSave(notes)}
          disabled={isBusy}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-50"
        >
          Save
        </button>

        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
