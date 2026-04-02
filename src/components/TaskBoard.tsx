import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  useTaskStore,
  type NewTask,
  type Task,
} from "../stores/useTaskStore";
import {
  filterTasksByPriority,
  PRIORITY_ORDER,
} from "../lib/taskUtils";
import { StatsBar } from "./StatsBar";
import { TaskDrawer } from "./TaskDrawer";
import { TaskSection } from "./TaskSection";

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

  function openCreate() {
    setDrawerMode("create");
    setEditingTask(null);
    setDrawerOpen(true);
  }

  function openEdit(task: Task) {
    setDrawerMode("edit");
    setEditingTask(task);
    setDrawerOpen(true);
  }

  async function handleSave(payload: NewTask | Task) {
    if ("id" in payload && "done" in payload) {
      await updateTask(payload as Task);
    } else {
      await addTask(payload as NewTask);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 p-2.5">
      <header
        data-tauri-drag-region
        className="ui-panel flex shrink-0 cursor-default select-none items-stretch gap-2 px-3 py-2.5"
      >
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
          <p className="ui-text-secondary text-[12px] font-medium leading-tight">
            {dateLabel}
          </p>
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
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={openCreate}
          className="ui-btn-primary no-drag pointer-events-auto flex size-10 shrink-0 items-center justify-center self-center text-xl font-light leading-none shadow-sm transition"
          aria-label="新建任务"
        >
          +
        </button>
      </header>

      <div className="ui-panel-muted min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
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
              />
            ))}
          </div>
        )}
      </div>

      <StatsBar tasks={tasks} />

      <TaskDrawer
        open={drawerOpen}
        mode={drawerMode}
        task={editingTask}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
