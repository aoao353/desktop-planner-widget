import { motion } from "framer-motion";
import type { Priority, Task } from "../stores/useTaskStore";
import { priorityLabels } from "../lib/taskUtils";
import { TaskCard } from "./TaskCard";

const dotClass: Record<Priority, string> = {
  urgent: "ui-dot ui-dot--urgent",
  high: "ui-dot ui-dot--high",
  normal: "ui-dot ui-dot--normal",
  low: "ui-dot ui-dot--low",
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
        <span className={dotClass[priority]} aria-hidden />
        <h3 className="ui-text-primary text-[12px] font-semibold tracking-wide">
          {priorityLabels[priority]}
        </h3>
        <span className="ui-text-tertiary text-[11px]">({tasks.length})</span>
      </div>
      {tasks.length === 0 ? (
        <p
          className="rounded-[var(--radius-card)] border border-dashed px-3 py-4 text-center text-[11px]"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-surface-muted)",
            color: "var(--color-text-tertiary)",
          }}
        >
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
