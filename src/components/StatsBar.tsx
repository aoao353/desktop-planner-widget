import type { Task } from "../stores/useTaskStore";
import { countDueToday } from "../lib/taskUtils";

type Props = {
  tasks: Task[];
};

export function StatsBar({ tasks }: Props) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.done).length;
  const dueToday = countDueToday(tasks);

  return (
    <div className="ui-panel-muted flex shrink-0 items-center justify-between gap-2 px-3 py-2.5 text-[0.7857rem]">
      <div className="flex flex-col gap-0.5">
        <span className="ui-text-tertiary">总任务</span>
        <span className="ui-text-primary text-sm font-semibold tabular-nums">
          {total}
        </span>
      </div>
      <div
        className="h-8 w-px shrink-0"
        style={{ background: "var(--color-border)" }}
      />
      <div className="flex flex-col gap-0.5">
        <span className="ui-text-tertiary">已完成</span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: "var(--color-done)" }}
        >
          {completed}
        </span>
      </div>
      <div
        className="h-8 w-px shrink-0"
        style={{ background: "var(--color-border)" }}
      />
      <div className="flex flex-col gap-0.5">
        <span className="ui-text-tertiary">今日到期</span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: "var(--color-stat-today)" }}
        >
          {dueToday}
        </span>
      </div>
    </div>
  );
}
