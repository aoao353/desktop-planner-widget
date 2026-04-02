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
      className="ui-card group relative px-2.5 py-2 transition-colors"
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
          className="ui-checkbox-task no-drag mt-0.5 size-4 shrink-0 cursor-pointer rounded border"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-surface)",
          }}
          aria-label={task.done ? "标记未完成" : "标记完成"}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p
            className={`text-[13px] font-medium leading-snug ${
              task.done ? "ui-text-tertiary line-through" : "ui-text-primary"
            }`}
          >
            {task.name}
          </p>
          <div className="ui-text-secondary flex flex-wrap items-center gap-1.5 text-[11px]">
            <span
              className="rounded-[6px] px-1.5 py-0.5"
              style={{
                background: "var(--color-surface-muted)",
                color: "var(--color-text-secondary)",
              }}
            >
              {tagLabels[task.tag]}
            </span>
            {task.due ? (
              <span className="tabular-nums">
                截止 {formatDisplayDate(task.due)}
              </span>
            ) : (
              <span className="ui-text-tertiary">无截止日</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="no-drag rounded-[var(--radius-button)] px-2 py-1 text-[11px] transition"
            style={{ color: "var(--color-brand)" }}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="no-drag rounded-[var(--radius-button)] px-2 py-1 text-[11px] transition"
            style={{ color: "var(--color-danger)" }}
          >
            删除
          </button>
        </div>
      </div>
    </motion.div>
  );
}
