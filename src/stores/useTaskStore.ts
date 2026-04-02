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
  toggleTask: (id: number) => Promise<Task>;
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
      const updated = await invoke<Task>("update_task", { task });
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === updated.id ? updated : t)),
      }));
      return updated;
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
      const updated = await invoke<Task>("toggle_task", { id });
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === updated.id ? updated : t)),
      }));
      return updated;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },
}));
