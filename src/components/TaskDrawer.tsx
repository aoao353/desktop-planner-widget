import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import type { NewTask, Priority, Tag, Task } from "../stores/useTaskStore";
import {
  priorityLabels,
  PRIORITY_ORDER,
  TAG_ORDER,
  tagLabels,
} from "../lib/taskUtils";

type Mode = "create" | "edit";

type Props = {
  open: boolean;
  mode: Mode;
  task: Task | null;
  /** 新建时预选的优先级（例如从分组旁「+」打开） */
  initialPriority?: Priority;
  onClose: () => void;
  onSave: (payload: NewTask | Task) => Promise<void>;
};

const emptyForm = (): NewTask => ({
  name: "",
  priority: "normal",
  tag: "personal",
  due: null,
});

export function TaskDrawer({
  open,
  mode,
  task,
  initialPriority,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [tag, setTag] = useState<Tag>("personal");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && task) {
      setName(task.name);
      setPriority(task.priority);
      setTag(task.tag);
      setDue(task.due ? task.due.slice(0, 10) : "");
    } else {
      const e = emptyForm();
      setName(e.name);
      setPriority(initialPriority ?? e.priority);
      setTag(e.tag);
      setDue("");
    }
  }, [open, mode, task, initialPriority]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const dueVal = due.trim() ? due.trim() : null;
      if (mode === "edit" && task) {
        await onSave({
          ...task,
          name: name.trim(),
          priority,
          tag,
          due: dueVal,
        });
      } else {
        await onSave({
          name: name.trim(),
          priority,
          tag,
          due: dueVal,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const panelStyle = {
    background: "var(--color-surface-elevated)",
    borderColor: "var(--color-border)",
    borderBottom: "none",
  };

  const inputClass =
    "ui-input w-full px-3 py-2.5 text-[1rem] placeholder:text-[var(--color-text-tertiary)]";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="drawer-backdrop"
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
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="no-drag fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-[var(--radius-window)] border border-b-0 shadow-2xl backdrop-blur-xl"
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
                id="drawer-title"
                className="ui-text-primary mb-4 text-center text-[1.0714rem] font-semibold"
              >
                {mode === "create" ? "新建任务" : "编辑任务"}
              </h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="ui-text-secondary text-[0.7857rem] font-medium">
                    名称
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="要做什么？"
                    className={inputClass}
                    autoFocus
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="ui-text-secondary text-[0.7857rem] font-medium">
                    优先级
                  </span>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as Priority)
                    }
                    className={`${inputClass} cursor-pointer`}
                  >
                    {PRIORITY_ORDER.map((p) => (
                      <option key={p} value={p}>
                        {priorityLabels[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="ui-text-secondary text-[0.7857rem] font-medium">
                    分类
                  </span>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as Tag)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {TAG_ORDER.map((t) => (
                      <option key={t} value={t}>
                        {tagLabels[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="ui-text-secondary text-[0.7857rem] font-medium">
                    截止日期
                  </span>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="ui-btn-ghost flex-1 py-3 text-[1rem] font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !name.trim()}
                    className="ui-btn-primary flex-1 py-3 text-[1rem] font-medium disabled:opacity-45"
                  >
                    {saving ? "保存中…" : "保存"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
