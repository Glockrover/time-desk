export type BreakEntry = {
  id: number;
  timeEntryId: number;
  startTime: string;
  endTime: string | null;
};

export type TimeEntry = {
  id: number;
  userId: number;
  projectId: number | null;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  breaks: BreakEntry[];
};

export type Project = {
  id: number;
  name: string;
};

export type ReportPeriod = "daily" | "weekly" | "monthly";
