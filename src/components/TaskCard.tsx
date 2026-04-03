import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Task } from "../stores/useTaskStore";
import { formatDisplayDate, tagLabels } from "../lib/taskUtils";

type Props = {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  compact?: boolean;
  /** 拖拽排序手柄（由 dnd-kit 注入 listeners / attributes） */
  dragHandle?: ReactNode;
};

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  compact = false,
  dragHandle,
}: Props) {
  return (
    <motion.div
      layout={!dragHandle}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
      whileHover={{
        y: -1,
        boxShadow: "var(--shadow-card-hover)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`ui-card group relative transition-colors ${compact ? "px-2 py-1" : "px-2.5 py-2"}`}
    >
      <div className="flex items-center gap-2">
        {dragHandle ? (
          <span className="no-drag flex shrink-0">{dragHandle}</span>
        ) : null}
        <span className="relative flex size-3.5 shrink-0 items-center justify-center">
          <AnimatePresence>
            {task.done ? (
              <motion.span
                key="ripple"
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ background: "var(--color-done)" }}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            ) : null}
          </AnimatePresence>
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => onToggle(task.id)}
            className="ui-checkbox-task no-drag relative z-10 size-3.5 shrink-0 cursor-pointer rounded border"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
            }}
            aria-label={task.done ? "标记未完成" : "标记完成"}
          />
        </span>
        <motion.p
          data-done={task.done ? "true" : "false"}
          className={`task-name-strike min-w-0 flex-1 leading-snug ${compact ? "text-[0.8571rem]" : "text-[0.9286rem] font-medium"} ${
            task.done ? "ui-text-tertiary" : "ui-text-primary"
          }`}
        >
          {task.name}
        </motion.p>
        {!compact && (
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="no-drag rounded-[var(--radius-button)] px-2 py-1 text-[0.7857rem] transition"
              style={{ color: "var(--color-brand)" }}
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="no-drag rounded-[var(--radius-button)] px-2 py-1 text-[0.7857rem] transition"
              style={{ color: "var(--color-danger)" }}
            >
              删除
            </button>
          </div>
        )}
      </div>
      {!compact && (
        <div
          className="mt-1 ml-5.5 flex flex-wrap items-center gap-1.5 text-[0.7857rem]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <span
            className="rounded-[0.4286rem] px-1.5 py-0.5"
            style={{
              background: "var(--color-surface-muted)",
              color: "var(--color-text-secondary)",
            }}
          >
            {tagLabels[task.tag]}
          </span>
          {task.due ? (
            <span className="tabular-nums">截止 {formatDisplayDate(task.due)}</span>
          ) : (
            <span style={{ color: "var(--color-text-tertiary)" }}>无截止日</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
