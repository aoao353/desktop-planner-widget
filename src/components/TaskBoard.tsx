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
      <header className="flex shrink-0 items-stretch gap-2 rounded-2xl border border-white/10 bg-zinc-950/40 px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-2xl">
        <div
          data-tauri-drag-region
          className="flex min-w-0 flex-1 flex-col justify-center gap-2.5"
        >
          <p className="text-[12px] font-medium leading-tight text-white/80">
            {dateLabel}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500/90 to-teal-400/90"
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 280, damping: 32 }}
              />
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-white/45">
              {done}/{total}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="no-drag flex size-10 shrink-0 items-center justify-center self-center rounded-xl border border-white/12 bg-sky-500/25 text-xl font-light leading-none text-white/95 shadow-inner shadow-white/5 transition hover:bg-sky-500/40"
          aria-label="新建任务"
        >
          +
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-zinc-950/35 px-3 py-3 shadow-inner shadow-black/20 backdrop-blur-2xl">
        {error ? (
          <p className="mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[11px] text-rose-200/90">
            {error}
          </p>
        ) : null}

        {loading && tasks.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-white/40">加载中…</p>
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
