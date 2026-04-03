import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import type { Priority, Task } from "../stores/useTaskStore";
import { priorityLabels } from "../lib/taskUtils";
import { TaskCard } from "./TaskCard";

const dotClass: Record<Priority, string> = {
  urgent: "ui-dot ui-dot--urgent",
  high: "ui-dot ui-dot--high",
  normal: "ui-dot ui-dot--normal",
  low: "ui-dot ui-dot--low",
};

const liExit = { opacity: 0, x: -16, transition: { duration: 0.2 } };

const emptyMotionProps = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: 0.2 },
};

export function columnDroppableId(priority: Priority): string {
  return `column-${priority}`;
}

type Props = {
  priority: Priority;
  tasks: Task[];
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onAddInSection?: () => void;
  /** 同优先级内拖拽结束后的 id 顺序（持久化由上层调用 invoke） */
  onReorder?: (orderedIds: number[]) => void;
};

function SortableTaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dragShadow = isDark
    ? "0 8px 24px rgba(0,0,0,0.35)"
    : "0 8px 24px rgba(0,0,0,0.12)";

  const style = {
    transform: CSS.Transform.toString(
      transform ? { ...transform, scaleX: 1, scaleY: 1 } : null,
    ),
    transition: isDragging ? "none" : transition,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging ? dragShadow : undefined,
  };

  return (
    <motion.li
      ref={setNodeRef}
      layout
      style={style}
      exit={liExit}
      className={[
        isDragging ? "opacity-95" : "",
        "rounded-[var(--radius-card)] transition-shadow duration-200",
        isDragging ? "ring-1 ring-[var(--color-border-strong)]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={isDragging ? "pointer-events-none opacity-0" : undefined}
        style={{
          transition: isDragging ? undefined : "opacity 0.15s ease-out",
        }}
      >
        <TaskCard
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          dragHandle={
            <button
              type="button"
              className="no-drag flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-[var(--radius-button)] active:cursor-grabbing"
              style={{ color: "var(--color-text-tertiary)" }}
              {...listeners}
              {...attributes}
              aria-label="拖动排序"
              title="拖动排序"
            >
              <span className="select-none text-[0.9286rem] leading-none tracking-tighter">
                ⋮
                <br />
                ⋮
              </span>
            </button>
          }
        />
      </div>
    </motion.li>
  );
}

/** 须在 TaskBoard 的 DndContext 内渲染 */
export function TaskSection({
  priority,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onAddInSection,
  onReorder,
}: Props) {
  const droppableId = columnDroppableId(priority);
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
  });

  const sortableIds = tasks.map((t) => t.id);

  const listContent =
    onReorder && tasks.length > 0 ? (
      <SortableContext
        items={sortableIds}
        strategy={verticalListSortingStrategy}
      >
        <ul className="relative space-y-1.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.map((t) => (
              <SortableTaskRow
                key={t.id}
                task={t}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </ul>
      </SortableContext>
    ) : (
      <ul className="space-y-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.map((t) => (
            <motion.li key={t.id} layout exit={liExit}>
              <TaskCard
                task={t}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    );

  const emptyDroppable =
    onReorder && tasks.length === 0 ? (
      <SortableContext items={[]} strategy={verticalListSortingStrategy}>
        <motion.p
          className="min-h-[3.7143rem] rounded-[var(--radius-card)] border border-dashed px-3 py-4 text-center text-[0.7857rem]"
          style={{
            borderColor: isOver ? "var(--color-brand)" : "var(--color-border)",
            background: "var(--color-surface-muted)",
            color: "var(--color-text-tertiary)",
          }}
          {...emptyMotionProps}
        >
          拖入任务到此优先级
        </motion.p>
      </SortableContext>
    ) : null;

  return (
    <motion.section
      layout
      ref={setNodeRef}
      className={`space-y-2 rounded-[var(--radius-card)] ${onReorder ? "outline -outline-offset-1 " : ""}`}
      style={
        onReorder
          ? {
              outlineColor: isOver
                ? "color-mix(in srgb, var(--color-brand) 45%, transparent)"
                : "transparent",
              background: isOver
                ? "color-mix(in srgb, var(--color-brand) 4%, transparent)"
                : "transparent",
              transition: "background 0.2s ease, outline-color 0.2s ease",
            }
          : undefined
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2 px-0.5">
        <span className={dotClass[priority]} aria-hidden />
        <h3 className="ui-text-primary min-w-0 flex-1 text-[0.8571rem] font-semibold tracking-wide">
          {priorityLabels[priority]}
        </h3>
        <span className="ui-text-tertiary shrink-0 text-[0.7857rem]">
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
            className="no-drag flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-button)] text-[1.0714rem] font-light leading-none transition"
            style={{ color: "var(--color-brand)" }}
            aria-label={`在${priorityLabels[priority]}下新建任务`}
            title="在此优先级下新建"
          >
            +
          </button>
        ) : null}
      </div>
      {tasks.length === 0 ? (
        emptyDroppable ?? (
          <motion.p
            className="rounded-[var(--radius-card)] border border-dashed px-3 py-4 text-center text-[0.7857rem]"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface-muted)",
              color: "var(--color-text-tertiary)",
            }}
            {...emptyMotionProps}
          >
            暂无任务
          </motion.p>
        )
      ) : (
        listContent
      )}
    </motion.section>
  );
}
