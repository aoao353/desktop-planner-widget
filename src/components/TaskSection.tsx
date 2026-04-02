import { motion } from "framer-motion";
import type { Priority, Task } from "../stores/useTaskStore";
import { priorityLabels } from "../lib/taskUtils";
import { TaskCard } from "./TaskCard";

const dotClass: Record<Priority, string> = {
  urgent: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.55)]",
  high: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.45)]",
  normal: "bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.45)]",
  low: "bg-zinc-500 shadow-[0_0_6px_rgba(113,113,122,0.4)]",
};

type Props = {
  priority: Priority;
  tasks: Task[];
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
};

export function TaskSection({
  priority,
  tasks,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  return (
    <motion.section
      layout
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2 px-0.5">
        <span
          className={`size-2 shrink-0 rounded-full ${dotClass[priority]}`}
          aria-hidden
        />
        <h3 className="text-[12px] font-semibold tracking-wide text-white/75">
          {priorityLabels[priority]}
        </h3>
        <span className="text-[11px] text-white/35">({tasks.length})</span>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-center text-[11px] text-white/35">
          暂无任务
        </p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li key={t.id}>
              <TaskCard
                task={t}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
