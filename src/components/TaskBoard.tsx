import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  useTaskStore,
  type NewTask,
  type Priority,
  type Task,
} from "../stores/useTaskStore";
import { onWindowDragMouseDown } from "../lib/windowDrag";
import {
  filterTasksByPriority,
  PRIORITY_ORDER,
} from "../lib/taskUtils";
import { StatsBar } from "./StatsBar";
import { TaskCard } from "./TaskCard";
import { TaskDrawer } from "./TaskDrawer";
import { TaskSection } from "./TaskSection";

/**
 * 窗口逻辑高度（`LogicalSize`，与 `setSize` 一致）。
 * 须与顶栏、内边距、正文区布局大致匹配；根字号见 `src/index.css` 的 `html { font-size }`
 *（运行时可被设置中的字号覆盖）。若改布局或全局字号，请同步调整，避免裁切或过多留白。
 */
const FULL_HEIGHT = 600;
/** 精简模式：同上，需与折叠后可见内容高度协调 */
const COMPACT_HEIGHT = 240;

function overlayShadow(): string {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isDark
    ? "0 12px 32px rgba(0,0,0,0.35)"
    : "0 12px 32px rgba(0,0,0,0.15)";
}

export function TaskBoard() {
  const {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    reorderTasksInPriority,
    moveTaskBetweenPriorities,
  } = useTaskStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createPriority, setCreatePriority] = useState<Priority | null>(null);
  const [compact, setCompact] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  function sortByOrder(a: Task, b: Task) {
    return (a.order ?? 0) - (b.order ?? 0) || a.id - b.id;
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === Number(event.active.id));
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    try {
      const { active, over } = event;
      if (!over) return;
      const activeId = Number(active.id);
      const dragged = tasks.find((t) => t.id === activeId);
      if (!dragged) return;

      const overRaw = over.id;
      if (activeId === Number(overRaw)) return;

      const from = dragged.priority;

      if (String(overRaw).startsWith("column-")) {
        const to = String(overRaw).replace("column-", "") as Priority;
        const destSorted = tasks
          .filter((t) => t.priority === to && t.id !== activeId)
          .sort(sortByOrder);
        const newIds = [...destSorted.map((t) => t.id), activeId];
        void moveTaskBetweenPriorities(activeId, to, newIds);
        return;
      }

      const overTask = tasks.find((t) => t.id === Number(overRaw));
      if (!overTask) return;
      const to = overTask.priority;

      if (from === to) {
        const ids = filterTasksByPriority(tasks, from).map((t) => t.id);
        const oldIndex = ids.indexOf(activeId);
        const newIndex = ids.indexOf(Number(overRaw));
        if (oldIndex < 0 || newIndex < 0) return;
        const newIds = arrayMove(ids, oldIndex, newIndex);
        void reorderTasksInPriority(from, newIds);
        return;
      }

      const destSorted = tasks
        .filter((t) => t.priority === to && t.id !== activeId)
        .sort(sortByOrder);
      const overIdx = destSorted.findIndex((t) => t.id === overTask.id);
      if (overIdx < 0) return;
      const newIds = [
        ...destSorted.slice(0, overIdx).map((t) => t.id),
        activeId,
        ...destSorted.slice(overIdx).map((t) => t.id),
      ];
      void moveTaskBetweenPriorities(activeId, to, newIds);
    } finally {
      setActiveTask(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 p-2.5">
      <header className="ui-panel flex shrink-0 select-none items-stretch gap-2 px-3 py-2.5">
        <div
          className="window-drag-handle flex min-w-0 flex-1 flex-col justify-center gap-2.5"
          onMouseDown={onWindowDragMouseDown}
        >
          <p className="ui-text-secondary text-[0.8571rem] font-medium leading-tight">
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
              <span className="ui-text-tertiary pointer-events-none shrink-0 text-[0.7857rem] tabular-nums">
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

      <motion.div
        className="no-drag ui-panel-muted min-h-0 flex-1 overflow-x-hidden px-3 py-3"
        style={{ overflowY: compact ? "hidden" : "auto" }}
        initial={false}
        animate={{
          opacity: compact ? 0 : 1,
          height: compact ? 0 : "auto",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {error ? (
          <p
            className="mb-2 rounded-[var(--radius-card)] border px-2 py-1.5 text-[0.7857rem]"
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
          <p className="ui-text-tertiary py-8 text-center text-[0.8571rem]">
            加载中…
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveTask(null)}
          >
            <div
              className="space-y-5 pb-1"
              style={{ display: compact ? "none" : undefined }}
            >
              {PRIORITY_ORDER.map((p) => (
                <TaskSection
                  key={p}
                  priority={p}
                  tasks={filterTasksByPriority(tasks, p)}
                  onToggle={(id) => void toggleTask(id)}
                  onEdit={openEdit}
                  onDelete={(id) => void deleteTask(id)}
                  onAddInSection={() => openCreate(p)}
                  onReorder={(orderedIds) =>
                    void reorderTasksInPriority(p, orderedIds)
                  }
                  compact={false}
                />
              ))}
            </div>

            <DragOverlay
              dropAnimation={{
                duration: 180,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
              {activeTask ? (
                <div
                  className="pointer-events-none"
                  style={{
                    transform: "rotate(1.5deg) scale(1.02)",
                    boxShadow: overlayShadow(),
                    borderRadius: "var(--radius-card)",
                    opacity: 0.98,
                  }}
                >
                  <TaskCard
                    task={activeTask}
                    onToggle={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    compact={false}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </motion.div>

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
