import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export type Priority = "urgent" | "high" | "normal" | "low";
export type Tag = "work" | "design" | "personal";

export interface Task {
  id: number;
  name: string;
  priority: Priority;
  tag: Tag;
  due: string | null;
  done: boolean;
  /** 同优先级内排序，越小越靠前 */
  order: number;
  /** 创建日 YYYY-MM-DD */
  createdDate: string | null;
  /** 完成日 YYYY-MM-DD，未完成为 null */
  completedDate: string | null;
}

export interface NewTask {
  name: string;
  priority: Priority;
  tag: Tag;
  due: string | null;
}

type TaskState = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (task: NewTask) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task>;
  deleteTask: (id: number) => Promise<boolean>;
  toggleTask: (id: number) => Promise<void>;
  reorderTasksInPriority: (
    priority: Priority,
    orderedIds: number[],
  ) => Promise<void>;
  /** 跨优先级移动并在目标组内排序（orderedIdsInTarget 须含该任务 id） */
  moveTaskBetweenPriorities: (
    taskId: number,
    targetPriority: Priority,
    orderedIdsInTarget: number[],
  ) => Promise<void>;
};

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await invoke<Task[]>("get_tasks");
      set({ tasks, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  addTask: async (task) => {
    set({ error: null });
    try {
      const created = await invoke<Task>("add_task", { task });
      set((s) => ({ tasks: [...s.tasks, created] }));
      return created;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateTask: async (task) => {
    set({ error: null });
    try {
      const tasks = await invoke<Task[]>("update_task", { task });
      set({ tasks });
      return tasks.find((t) => t.id === task.id)!;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  deleteTask: async (id) => {
    set({ error: null });
    try {
      const removed = await invoke<boolean>("delete_task", { id });
      if (removed) {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      }
      return removed;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  toggleTask: async (id) => {
    set({ error: null });
    try {
      const tasks = await invoke<Task[]>("toggle_task", { id });
      set({ tasks });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  reorderTasksInPriority: async (priority, orderedIds) => {
    set({ error: null });
    try {
      const tasks = await invoke<Task[]>("reorder_tasks_in_priority", {
        priority,
        orderedIds,
      });
      set({ tasks });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  moveTaskBetweenPriorities: async (taskId, targetPriority, orderedIdsInTarget) => {
    set({ error: null });
    try {
      const tasks = await invoke<Task[]>("move_task_between_priorities", {
        taskId,
        targetPriority,
        orderedIdsInTarget,
      });
      set({ tasks });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },
}));
