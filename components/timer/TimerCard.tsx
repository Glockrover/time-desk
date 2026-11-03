"use client";

import { useState } from "react";
import FaceCameraPanel from "@/components/camera/FaceCameraPanel";
import ProjectPicker from "@/components/timer/ProjectPicker";
import type { FaceCamera } from "@/hooks/useFaceCamera";
import type { TimeTracker } from "@/hooks/useTimeTracker";
import { getProjectColor, getProjectName } from "@/lib/time-tracking/projects";
import {
  formatClockTime,
  formatTime,
  getWorkedSeconds,
} from "@/lib/time-tracking/time";

type TimerCardProps = {
  tracker: TimeTracker;
  camera: FaceCamera;
  selectedProjectId: number | null;
  onSelectProject: (projectId: number | null) => void;
};

export default function TimerCard({
  tracker,
  camera,
  selectedProjectId,
  onSelectProject,
}: TimerCardProps) {
  const [notes, setNotes] = useState("");

  const {
    projects,
    activeEntry,
    activeBreak,
    isWorking,
    isOnBreak,
    isBusy,
  } = tracker;

  const seconds = activeEntry
    ? getWorkedSeconds(activeEntry, tracker.now ?? 0)
    : 0;

  const startTimer = async () => {
    if (selectedProjectId === null) {
      alert("Please select a project before starting work.");
      return false;
    }

    const started = await tracker.startWork(selectedProjectId, notes);

    if (started) {
      setNotes("");
    }

    return started === true;
  };

  const addProject = async (name: string) => {
    const project = await tracker.addProject(name);

    if (!project) return false;

    onSelectProject(project.id);
    return true;
  };

  return (
    <section
      className={`mt-6 rounded-xl border bg-white p-4 shadow-sm sm:p-5 ${
        isWorking ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {activeEntry ? (
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isOnBreak ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  On break
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <span
                  className={`h-2 w-2 rounded-full ${getProjectColor(
                    projects,
                    activeEntry.projectId
                  )}`}
                />
                {getProjectName(projects, activeEntry.projectId)}
              </span>
            </div>

            <p className="mt-1.5 truncate text-sm text-slate-500">
              {activeEntry.notes || "No description"} · started{" "}
              {formatClockTime(activeEntry.startTime)}
              {activeBreak &&
                ` · on break since ${formatClockTime(activeBreak.startTime)}`}
            </p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="notes">
              What are you working on?
            </label>
            <input
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What are you working on?"
              maxLength={2000}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <ProjectPicker
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelect={onSelectProject}
              onAddProject={addProject}
              isBusy={isBusy}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span
            className={`font-mono text-2xl font-semibold tabular-nums ${
              isOnBreak ? "text-slate-400" : "text-slate-900"
            }`}
          >
            {formatTime(seconds)}
          </span>

          <div className="flex items-center gap-2">
            {isWorking && (
              <button
                onClick={() => {
                  // A manual break or resume is never undone by the camera.
                  camera.setAutoBreak(false);

                  if (isOnBreak) {
                    tracker.endBreak();
                  } else {
                    tracker.startBreak();
                  }
                }}
                disabled={isBusy}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
              >
                {isOnBreak ? "Resume" : "Break"}
              </button>
            )}

            <button
              onClick={isWorking ? tracker.stopWork : startTimer}
              disabled={isOnBreak || isBusy}
              title={isOnBreak ? "Resume work before stopping." : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                isWorking
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isWorking ? "Stop" : "Start"}
            </button>
          </div>
        </div>
      </div>

      <FaceCameraPanel
        camera={camera}
        tracker={tracker}
        selectedProjectId={selectedProjectId}
        onStartTimer={startTimer}
      />
    </section>
  );
}
