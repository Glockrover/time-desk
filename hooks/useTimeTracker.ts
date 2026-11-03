"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProject,
  listProjects,
  listTimeEntries,
  startTimeEntry,
  updateTimeEntry,
  type TimeEntryUpdate,
} from "@/lib/time-tracking/api";
import type { Project, TimeEntry } from "@/lib/time-tracking/types";

type UseTimeTrackerOptions = {
  // Called with the entries after every load from the server.
  onLoad: (entries: TimeEntry[]) => void;
};

// Owns the user's time entries and projects, and the actions that change them.
export function useTimeTracker({ onLoad }: UseTimeTrackerOptions) {
  const router = useRouter();

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // The clock every duration on the page is measured against. It stays null
  // until the first load finishes in the browser, so the server render and
  // the hydrating client render agree. After that it ticks each second while
  // a session is running.
  const [now, setNow] = useState<number | null>(null);

  // True while a start/break/stop/notes request is in flight, so slow
  // responses can't be double-submitted.
  const [isBusy, setIsBusy] = useState(false);

  const activeEntry = timeEntries.find((entry) => entry.endTime === null);
  const isWorking = activeEntry !== undefined;
  const activeBreak = activeEntry?.breaks.find(
    (breakEntry) => breakEntry.endTime === null
  );
  const isOnBreak = activeBreak !== undefined;

  const handleInitialLoad = useEffectEvent(onLoad);

  // Load once on mount. The state updates happen after the fetches resolve,
  // not synchronously in the effect.
  useEffect(() => {
    let cancelled = false;

    Promise.all([listTimeEntries(), listProjects()]).then(
      ([entriesResult, projectsResult]) => {
        if (cancelled) return;

        if (
          (!entriesResult.ok && entriesResult.status === 401) ||
          (!projectsResult.ok && projectsResult.status === 401)
        ) {
          router.replace("/login");
          return;
        }

        if (!entriesResult.ok || !projectsResult.ok) {
          throw new Error("Failed to load time entries or projects");
        }

        setTimeEntries(entriesResult.data);
        setProjects(projectsResult.data);
        setNow(Date.now());
        handleInitialLoad(entriesResult.data);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!isWorking) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [isWorking]);

  // Runs one request at a time; returns undefined if another is in flight.
  const runAction = async <T>(action: () => Promise<T>) => {
    if (isBusy) return undefined;

    setIsBusy(true);

    try {
      return await action();
    } finally {
      setIsBusy(false);
    }
  };

  const refresh = async () => {
    const result = await listTimeEntries();

    if (!result.ok) {
      if (result.status === 401) {
        router.replace("/login");
        return;
      }

      throw new Error(result.error);
    }

    setTimeEntries(result.data);
    onLoad(result.data);
  };

  // Resolves to true once the timer is running.
  const startWork = (projectId: number, notes: string) =>
    runAction(async () => {
      const result = await startTimeEntry(projectId, notes.trim() || null);

      if (!result.ok) {
        alert(result.error);
      }

      // Even on failure: the server may know about a session this page
      // doesn't (e.g. another tab).
      await refresh();

      return result.ok;
    });

  const update = (change: TimeEntryUpdate, fallbackError: string) =>
    runAction(async () => {
      const result = await updateTimeEntry(change, fallbackError);

      if (!result.ok) {
        alert(result.error);
      }

      await refresh();
    });

  const stopWork = () => update({ action: "stopWork" }, "Failed to stop work.");

  const startBreak = () =>
    update({ action: "startBreak" }, "Failed to start break.");

  const endBreak = () => update({ action: "endBreak" }, "Failed to end break.");

  // Resolves to true once the notes are saved.
  const saveNotes = (entryId: number, notes: string) =>
    runAction(async () => {
      const result = await updateTimeEntry(
        { action: "updateNotes", entryId, notes },
        "Failed to save notes."
      );

      if (!result.ok) {
        alert("Failed to save notes. Please try again.");
        return false;
      }

      await refresh();

      return true;
    });

  // Resolves to the new project, or null if it couldn't be created.
  const addProject = (name: string) =>
    runAction(async () => {
      const result = await createProject(name.trim());

      if (!result.ok) {
        alert(result.error);
        return null;
      }

      setProjects((current) => [...current, result.data]);

      return result.data;
    });

  return {
    timeEntries,
    projects,
    now,
    isBusy,
    activeEntry,
    activeBreak,
    isWorking,
    isOnBreak,
    startWork,
    stopWork,
    startBreak,
    endBreak,
    saveNotes,
    addProject,
  };
}

export type TimeTracker = ReturnType<typeof useTimeTracker>;
