"use client";

import { useState } from "react";
import type { Project } from "@/lib/time-tracking/types";

// Select value for the "add a project" entry in the project picker.
const NEW_PROJECT_OPTION = "new";

type ProjectPickerProps = {
  projects: Project[];
  selectedProjectId: number | null;
  onSelect: (projectId: number | null) => void;
  // Creates and selects a project; resolves to true on success.
  onAddProject: (name: string) => Promise<boolean>;
  isBusy: boolean;
};

export default function ProjectPicker({
  projects,
  selectedProjectId,
  onSelect,
  onAddProject,
  isBusy,
}: ProjectPickerProps) {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const closeForm = () => {
    setIsAddingProject(false);
    setNewProjectName("");
  };

  if (isAddingProject) {
    return (
      <form
        onSubmit={async (event) => {
          event.preventDefault();

          if (await onAddProject(newProjectName)) {
            closeForm();
          }
        }}
        className="flex gap-2 sm:w-72"
      >
        <label className="sr-only" htmlFor="new-project">
          New project name
        </label>
        <input
          id="new-project"
          autoFocus
          value={newProjectName}
          onChange={(event) => setNewProjectName(event.target.value)}
          placeholder="New project name"
          maxLength={100}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="submit"
          disabled={isBusy || !newProjectName.trim()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
        <button
          type="button"
          onClick={closeForm}
          className="rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <>
      <label className="sr-only" htmlFor="project">
        Project
      </label>
      <select
        id="project"
        value={selectedProjectId ?? ""}
        onChange={(event) => {
          if (event.target.value === NEW_PROJECT_OPTION) {
            setIsAddingProject(true);
            return;
          }

          onSelect(event.target.value ? Number(event.target.value) : null);
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-56"
      >
        <option value="">
          {projects.length === 0 ? "No projects yet" : "Select a project"}
        </option>

        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}

        <option value={NEW_PROJECT_OPTION}>+ Add a project…</option>
      </select>
    </>
  );
}
