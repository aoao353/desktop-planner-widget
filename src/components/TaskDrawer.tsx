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
  onClose: () => void;
  onSave: (payload: NewTask | Task) => Promise<void>;
};

const emptyForm = (): NewTask => ({
  name: "",
  priority: "normal",
  tag: "personal",
  due: null,
});

export function TaskDrawer({ open, mode, task, onClose, onSave }: Props) {
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
      setPriority(e.priority);
      setTag(e.tag);
      setDue("");
    }
  }, [open, mode, task]);

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

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="drawer-backdrop"
            type="button"
            aria-label="关闭"
            className="no-drag fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-[2px]"
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
            className="no-drag fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl border border-white/12 border-b-0 bg-zinc-900/85 shadow-2xl backdrop-blur-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 360 }}
          >
            <div className="mx-auto flex max-w-md flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
              <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-white/20" />
              <h2
                id="drawer-title"
                className="mb-4 text-center text-[15px] font-semibold text-white/95"
              >
                {mode === "create" ? "新建任务" : "编辑任务"}
              </h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-white/45">
                    名称
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="要做什么？"
                    className="rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:border-sky-400/50 focus:outline-none"
                    autoFocus
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-white/45">
                    优先级
                  </span>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as Priority)
                    }
                    className="cursor-pointer rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 text-[14px] text-white focus:border-sky-400/50 focus:outline-none"
                  >
                    {PRIORITY_ORDER.map((p) => (
                      <option key={p} value={p}>
                        {priorityLabels[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-white/45">
                    分类
                  </span>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as Tag)}
                    className="cursor-pointer rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 text-[14px] text-white focus:border-sky-400/50 focus:outline-none"
                  >
                    {TAG_ORDER.map((t) => (
                      <option key={t} value={t}>
                        {tagLabels[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-white/45">
                    截止日期
                  </span>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 text-[14px] text-white focus:border-sky-400/50 focus:outline-none"
                  />
                </label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-white/12 bg-white/5 py-3 text-[14px] font-medium text-white/80 hover:bg-white/10"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !name.trim()}
                    className="flex-1 rounded-xl bg-sky-500/80 py-3 text-[14px] font-medium text-white shadow-lg shadow-sky-900/30 hover:bg-sky-500 disabled:opacity-45"
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
