import type { Project, TimeEntry } from "./types";

// Browser-side client for the app's API routes.

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return typeof data?.error === "string" ? data.error : fallback;
  } catch {
    return fallback;
  }
}

async function request<T>(
  url: string,
  fallbackError: string,
  init?: { method: "POST" | "PATCH"; body: unknown }
): Promise<ApiResult<T>> {
  const response = await fetch(
    url,
    init && {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(init.body),
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: await getErrorMessage(response, fallbackError),
    };
  }

  return { ok: true, data: await response.json() };
}

export function listTimeEntries() {
  return request<TimeEntry[]>("/api/time-entries", "Failed to load time entries");
}

export function listProjects() {
  return request<Project[]>("/api/projects", "Failed to load projects");
}

export function createProject(name: string) {
  return request<Project>("/api/projects", "Failed to add project.", {
    method: "POST",
    body: { name },
  });
}

export function startTimeEntry(projectId: number, notes: string | null) {
  return request<TimeEntry>("/api/time-entries", "Failed to start work.", {
    method: "POST",
    body: { projectId, notes },
  });
}

export type TimeEntryUpdate =
  | { action: "stopWork" }
  | { action: "startBreak" }
  | { action: "endBreak" }
  | { action: "updateNotes"; entryId: number; notes: string };

export function updateTimeEntry(update: TimeEntryUpdate, fallbackError: string) {
  return request<unknown>("/api/time-entries", fallbackError, {
    method: "PATCH",
    body: update,
  });
}
