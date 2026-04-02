import type { Task } from "../stores/useTaskStore";

export type DayHistoryRow = {
  date: string;
  /** 当日标记完成的任务数（completedDate 为该日） */
  completedCount: number;
  /** 当日「归属」任务数：due 为该日，或无 due 时 createdDate 为该日 */
  totalCount: number;
  /** 完成率（0–100） */
  rate: number;
};

/** 按日期聚合历史：日期为至少出现过一次（完成日或归属日）的日历日，新到旧排序 */
export function buildDayHistory(tasks: Task[]): DayHistoryRow[] {
  const daySet = new Set<string>();
  for (const t of tasks) {
    const c = t.completedDate?.slice(0, 10);
    if (c) daySet.add(c);
    const anchor = t.due?.slice(0, 10) ?? t.createdDate?.slice(0, 10);
    if (anchor) daySet.add(anchor);
  }
  const sorted = [...daySet].sort((a, b) => b.localeCompare(a));
  return sorted.map((date) => {
    const completedCount = tasks.filter(
      (t) => t.completedDate?.slice(0, 10) === date,
    ).length;
    const totalCount = tasks.filter((t) => {
      const due = t.due?.slice(0, 10);
      const cr = t.createdDate?.slice(0, 10);
      if (due) return due === date;
      return cr === date;
    }).length;
    const rate =
      totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    return { date, completedCount, totalCount, rate };
  });
}

export function formatHistoryDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
