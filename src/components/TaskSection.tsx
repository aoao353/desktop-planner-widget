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
  /** 在分组标题旁添加任务，会按该分组优先级打开抽屉 */
  onAddInSection?: () => void;
  compact?: boolean;
};

export function TaskSection({
  priority,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onAddInSection,
  compact = false,
}: Props) {
  if (compact && tasks.length === 0) return null;

  return (
    <motion.section
      layout
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {!compact && (
        <div className="flex items-center gap-2 px-0.5">
          <span className={dotClass[priority]} aria-hidden />
          <h3 className="ui-text-primary min-w-0 flex-1 text-[12px] font-semibold tracking-wide">
            {priorityLabels[priority]}
          </h3>
          <span className="ui-text-tertiary shrink-0 text-[11px]">
            ({tasks.length})
          </span>
          {onAddInSection ? (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onAddInSection();
              }}
              className="no-drag flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-button)] text-[15px] font-light leading-none transition"
              style={{ color: "var(--color-brand)" }}
              aria-label={`在${priorityLabels[priority]}下新建任务`}
              title="在此优先级下新建"
            >
              +
            </button>
          ) : null}
        </div>
      )}
      {tasks.length === 0 && !compact ? (
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
        <ul className={compact ? "space-y-0.5" : "space-y-1.5"}>
          {tasks.map((t) => (
            <li key={t.id}>
              <TaskCard
                task={t}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                compact={compact}
              />
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
