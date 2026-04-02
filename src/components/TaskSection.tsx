import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  compact?: boolean;
};

function SortableTaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  compact,
}: {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  compact: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-70" : undefined}
    >
      <TaskCard
        task={task}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        compact={compact}
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
    </li>
  );
}

export function TaskSection({
  priority,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onAddInSection,
  onReorder,
  compact = false,
}: Props) {
  const droppableId = columnDroppableId(priority);
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
  });

  if (compact && tasks.length === 0) return null;

  const sortableIds = tasks.map((t) => t.id);

  const listContent =
    !compact && onReorder && tasks.length > 0 ? (
      <SortableContext
        items={sortableIds}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <SortableTaskRow
              key={t.id}
              task={t}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              compact={false}
            />
          ))}
        </ul>
      </SortableContext>
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
    );

  const emptyDroppable =
    !compact && onReorder && tasks.length === 0 ? (
      <SortableContext items={[]} strategy={verticalListSortingStrategy}>
        <p
          className="min-h-[3.7143rem] rounded-[var(--radius-card)] border border-dashed px-3 py-4 text-center text-[0.7857rem]"
          style={{
            borderColor: isOver ? "var(--color-brand)" : "var(--color-border)",
            background: "var(--color-surface-muted)",
            color: "var(--color-text-tertiary)",
          }}
        >
          拖入任务到此优先级
        </p>
      </SortableContext>
    ) : null;

  return (
    <motion.section
      layout
      ref={setNodeRef}
      className={`space-y-2 rounded-[var(--radius-card)] ${!compact && onReorder ? "outline -outline-offset-1 transition-[outline-color] " : ""}`}
      style={
        !compact && onReorder
          ? {
              outlineColor: isOver
                ? "color-mix(in srgb, var(--color-brand) 45%, transparent)"
                : "transparent",
            }
          : undefined
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {!compact && (
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
      )}
      {tasks.length === 0 && !compact ? (
        emptyDroppable ?? (
          <p
            className="rounded-[var(--radius-card)] border border-dashed px-3 py-4 text-center text-[0.7857rem]"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface-muted)",
              color: "var(--color-text-tertiary)",
            }}
          >
            暂无任务
          </p>
        )
      ) : (
        listContent
      )}
    </motion.section>
  );
}
