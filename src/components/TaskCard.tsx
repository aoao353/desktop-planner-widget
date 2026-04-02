import { motion } from "framer-motion";
import type { Task } from "../stores/useTaskStore";
import { formatDisplayDate, tagLabels } from "../lib/taskUtils";

type Props = {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
};

export function TaskCard({ task, onToggle, onEdit, onDelete }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-xl border border-white/[0.08] bg-black/20 px-2.5 py-2 transition-colors hover:border-white/15 hover:bg-black/30"
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
          className="no-drag mt-0.5 size-4 shrink-0 cursor-pointer rounded border-white/25 bg-white/5 accent-sky-400"
          aria-label={task.done ? "标记未完成" : "标记完成"}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p
            className={`text-[13px] font-medium leading-snug text-white/95 ${
              task.done ? "text-white/45 line-through" : ""
            }`}
          >
            {task.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-white/45">
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-white/70">
              {tagLabels[task.tag]}
            </span>
            {task.due ? (
              <span className="tabular-nums">
                截止 {formatDisplayDate(task.due)}
              </span>
            ) : (
              <span className="text-white/35">无截止日</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="no-drag rounded-lg px-2 py-1 text-[11px] text-sky-300/90 hover:bg-white/10"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="no-drag rounded-lg px-2 py-1 text-[11px] text-rose-300/90 hover:bg-rose-500/15"
          >
            删除
          </button>
        </div>
      </div>
    </motion.div>
  );
}
