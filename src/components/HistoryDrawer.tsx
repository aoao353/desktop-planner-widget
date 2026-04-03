import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import type { Task } from "../stores/useTaskStore";
import {
  buildDayHistory,
  formatHistoryDateLabel,
} from "../lib/historyUtils";

type Props = {
  open: boolean;
  tasks: Task[];
  onClose: () => void;
};

export function HistoryDrawer({ open, tasks, onClose }: Props) {
  const rows = useMemo(() => buildDayHistory(tasks), [tasks]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  const panelStyle = {
    background: "var(--color-surface-elevated)",
    borderColor: "var(--color-border)",
    borderBottom: "none",
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="history-backdrop"
            type="button"
            aria-label="关闭"
            className="no-drag fixed inset-0 z-40 cursor-default backdrop-blur-[2px]"
            style={{ background: "var(--color-backdrop)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="history-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
            className="no-drag fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-t-[var(--radius-window)] border border-b-0 shadow-2xl backdrop-blur-xl"
            style={panelStyle}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 360 }}
          >
            <div className="mx-auto flex max-w-md flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
              <div
                className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full"
                style={{ background: "var(--color-border-strong)" }}
              />
              <h2
                id="history-title"
                className="ui-text-primary mb-4 text-center text-[1.0714rem] font-semibold"
              >
                历史
              </h2>
              <p
                className="ui-text-tertiary mb-4 text-center text-[0.7857rem] leading-relaxed"
              >
                按日期汇总：完成数为当日勾选完成；总数为当日截止或（无截止日时）当日创建的任务数。
              </p>
              {rows.length === 0 ? (
                <p
                  className="ui-text-tertiary py-8 text-center text-[0.8571rem]"
                >
                  暂无历史数据
                </p>
              ) : (
                <ul className="flex flex-col gap-2 pb-2">
                  {rows.map((row) => (
                    <li
                      key={row.date}
                      className="ui-card flex flex-col gap-1.5 px-3 py-2.5"
                    >
                      <div className="ui-text-primary text-[0.9286rem] font-medium">
                        {formatHistoryDateLabel(row.date)}
                      </div>
                      <div className="flex items-baseline justify-between gap-2 text-[0.8571rem]">
                        <span className="ui-text-secondary">
                          完成{" "}
                          <span className="tabular-nums font-semibold text-[var(--color-done)]">
                            {row.completedCount}
                          </span>
                          {" / "}
                          <span className="tabular-nums">
                            {row.totalCount}
                          </span>
                        </span>
                        <span
                          className="tabular-nums font-semibold"
                          style={{ color: "var(--color-brand)" }}
                        >
                          {row.rate}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
