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
  return tasks
    .filter((t) => t.priority === p)
    .slice()
    .sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) || a.id - b.id,
    );
}

export function countDueToday(tasks: Task[]): number {
  return tasks.filter((t) => !t.done && isDueToday(t.due)).length;
}

/** 返回今天 + n 天的本地 YYYY-MM-DD */
export function offsetLocalISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 判断 due 是否为指定日期 */
export function isDueOn(due: string | null, ymd: string): boolean {
  if (!due) return false;
  return due.slice(0, 10) === ymd;
}

/** 按 due 日期过滤任务（含无截止日任务归入今天） */
export function filterTasksByDate(tasks: Task[], ymd: string): Task[] {
  const today = todayLocalISO();
  return tasks.filter((t) => {
    if (ymd === today && !t.due) return true;
    return isDueOn(t.due, ymd);
  });
}

/** 日期标签：今天/明天/后天/周几/具体日期 */
export function dateTabLabel(ymd: string): string {
  const today = todayLocalISO();
  const d = new Date(`${ymd}T12:00:00`);
  const diff = Math.round(
    (d.getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000,
  );
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === 2) return "后天";
  if (diff > 2 && diff <= 6) {
    return d.toLocaleDateString("zh-CN", { weekday: "short" });
  }
  return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

/**
 * 若 store 中每个任务都符合当前日期的筛选规则，则同优先级拖拽重排可用
 *（否则列表为子集，与后端「须含该优先级全部 id」约束冲突）。
 */
export function everyTaskMatchesDateView(
  tasks: Task[],
  viewDate: string,
): boolean {
  const today = todayLocalISO();
  return tasks.every((t) => {
    if (viewDate === today) {
      return !t.due || isDueOn(t.due, today);
    }
    return isDueOn(t.due, viewDate);
  });
}
