import type { Priority, Tag, Task } from "../stores/useTaskStore";

export const PRIORITY_ORDER: Priority[] = [
  "urgent",
  "high",
  "normal",
  "low",
];

export const TAG_ORDER: Tag[] = ["work", "design", "personal"];

export const priorityLabels: Record<Priority, string> = {
  urgent: "紧急",
  high: "高",
  normal: "普通",
  low: "低",
};

export const tagLabels: Record<Tag, string> = {
  work: "工作",
  design: "设计",
  personal: "个人",
};

/** 本地日期 YYYY-MM-DD */
export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDueToday(due: string | null): boolean {
  if (!due) return false;
  const normalized = due.slice(0, 10);
  return normalized === todayLocalISO();
}

export function formatDisplayDate(due: string | null): string {
  if (!due) return "";
  const part = due.slice(0, 10);
  return part.replace(/-/g, "/");
}

export function filterTasksByPriority(tasks: Task[], p: Priority): Task[] {
  return tasks.filter((t) => t.priority === p);
}

export function countDueToday(tasks: Task[]): number {
  return tasks.filter((t) => !t.done && isDueToday(t.due)).length;
}
