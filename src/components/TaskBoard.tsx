import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  useTaskStore,
  type NewTask,
  type Priority,
  type Task,
} from "../stores/useTaskStore";
import {
  filterTasksByPriority,
  PRIORITY_ORDER,
} from "../lib/taskUtils";
import { StatsBar } from "./StatsBar";
import { TaskDrawer } from "./TaskDrawer";
import { TaskSection } from "./TaskSection";

const FULL_HEIGHT = 600;
/** 折叠后仍保留顶栏与留白，避免窗口过矮只剩一行 */
const COMPACT_HEIGHT = 240;

export function TaskBoard() {
  const {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
  } = useTaskStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createPriority, setCreatePriority] = useState<Priority | null>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    void useTaskStore.getState().fetchTasks();
  }, []);

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const dateLabel = new Date().toLocaleDateString("zh-CN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function openCreate(priority?: Priority) {
    setDrawerMode("create");
    setEditingTask(null);
    setCreatePriority(priority ?? null);
    setDrawerOpen(true);
  }

  function openEdit(task: Task) {
    setDrawerMode("edit");
    setEditingTask(task);
    setCreatePriority(null);
    setDrawerOpen(true);
  }

  async function handleSave(payload: NewTask | Task) {
    if ("id" in payload && "done" in payload) {
      await updateTask(payload as Task);
    } else {
      await addTask(payload as NewTask);
    }
  }

  async function toggleCompact() {
    const next = !compact;
    setCompact(next);
    try {
      const win = getCurrentWindow();
      const factor = await win.scaleFactor();
      const { width } = await win.outerSize();
      const logicalWidth = Math.round(width / factor);
      const targetHeight = next ? COMPACT_HEIGHT : FULL_HEIGHT;
      await win.setSize(new LogicalSize(logicalWidth, targetHeight));
    } catch (e) {
      console.error("resize failed", e);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 p-2.5">
      <header className="ui-panel flex shrink-0 cursor-default select-none items-stretch gap-2 px-3 py-2.5">
        <div
          data-tauri-drag-region
          className="flex min-w-0 flex-1 flex-col justify-center gap-2.5"
        >
          <p className="ui-text-secondary text-[12px] font-medium leading-tight">
            {dateLabel}
          </p>
          {!compact && (
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--color-progress-track)" }}
              >
                <motion.div
                  className="pointer-events-none h-full rounded-full"
                  style={{ background: "var(--color-progress)" }}
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 280, damping: 32 }}
                />
              </div>
              <span className="ui-text-tertiary pointer-events-none shrink-0 text-[11px] tabular-nums">
                {done}/{total}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => void toggleCompact()}
          className="no-drag pointer-events-auto flex size-10 shrink-0 items-center justify-center self-center rounded-[var(--radius-button)] text-sm transition"
          style={{ color: "var(--color-text-tertiary)" }}
          aria-label={compact ? "展开" : "折叠"}
          title={compact ? "展开完整视图" : "精简模式"}
        >
          {compact ? "▽" : "△"}
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={() => openCreate()}
          className="ui-btn-primary no-drag pointer-events-auto flex size-10 shrink-0 items-center justify-center self-center text-xl font-light leading-none shadow-sm transition"
          aria-label="新建任务"
        >
          +
        </button>
      </header>

      <div
        className="no-drag ui-panel-muted min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3"
        style={{ display: compact ? "none" : undefined }}
      >
        {error ? (
          <p
            className="mb-2 rounded-[var(--radius-card)] border px-2 py-1.5 text-[11px]"
            style={{
              borderColor: "var(--color-danger)",
              background: "var(--color-danger-muted)",
              color: "var(--color-danger)",
            }}
          >
            {error}
          </p>
        ) : null}

        {loading && tasks.length === 0 ? (
          <p className="ui-text-tertiary py-8 text-center text-[12px]">
            加载中…
          </p>
        ) : (
          <div className="space-y-5 pb-1">
            {PRIORITY_ORDER.map((p) => (
              <TaskSection
                key={p}
                priority={p}
                tasks={filterTasksByPriority(tasks, p)}
                onToggle={(id) => void toggleTask(id)}
                onEdit={openEdit}
                onDelete={(id) => void deleteTask(id)}
                onAddInSection={() => openCreate(p)}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>

      {!compact && <StatsBar tasks={tasks} />}

      <TaskDrawer
        open={drawerOpen}
        mode={drawerMode}
        task={editingTask}
        initialPriority={
          drawerMode === "create" ? createPriority ?? undefined : undefined
        }
        onClose={() => {
          setDrawerOpen(false);
          setCreatePriority(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
