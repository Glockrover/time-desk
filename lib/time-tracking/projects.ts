import type { Project } from "./types";

// Listed as full class names so Tailwind generates them.
const PROJECT_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-orange-500",
];

export function getProjectName(projects: Project[], projectId: number | null) {
  if (projectId === null) {
    return "No project";
  }

  const project = projects.find((project) => project.id === projectId);

  return project?.name ?? "Unknown project";
}

export function getProjectColor(projects: Project[], projectId: number | null) {
  const index = projects.findIndex((project) => project.id === projectId);

  return index === -1
    ? "bg-slate-300"
    : PROJECT_COLORS[index % PROJECT_COLORS.length];
}
