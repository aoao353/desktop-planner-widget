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
    <div className="no-drag flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-[11px] text-white/60 backdrop-blur-xl">
      <div className="flex flex-col gap-0.5">
        <span className="text-white/40">总任务</span>
        <span className="text-sm font-semibold tabular-nums text-white/90">
          {total}
        </span>
      </div>
      <div className="h-8 w-px bg-white/10" />
      <div className="flex flex-col gap-0.5">
        <span className="text-white/40">已完成</span>
        <span className="text-sm font-semibold tabular-nums text-emerald-300/90">
          {completed}
        </span>
      </div>
      <div className="h-8 w-px bg-white/10" />
      <div className="flex flex-col gap-0.5">
        <span className="text-white/40">今日到期</span>
        <span className="text-sm font-semibold tabular-nums text-amber-300/90">
          {dueToday}
        </span>
      </div>
    </div>
  );
}
