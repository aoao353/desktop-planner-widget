import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { TaskBoard } from "./components/TaskBoard";
import { subscribeWindowEdgeSnap } from "./lib/windowEdgeSnap";
import { DEFAULT_FONT_SIZE_PX, setRootFontSizePx } from "./lib/rootFontSize";
import { useTaskStore } from "./stores/useTaskStore";
import type { AppConfigJson } from "./types/appConfig";

export default function App() {
  const tasks = useTaskStore((s) => s.tasks);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shellOpacity, setShellOpacity] = useState(1);

  useEffect(() => {
    void invoke<AppConfigJson>("get_app_config")
      .then((cfg) => {
        setShellOpacity(cfg.windowOpacity ?? 1);
        setRootFontSizePx(cfg.fontSizePx ?? DEFAULT_FONT_SIZE_PX);
      })
      .catch(() => {
        setRootFontSizePx(DEFAULT_FONT_SIZE_PX);
      });
  }, []);

  /** 拖拽停顿后：窗口靠近工作区边缘 30px 内则吸附对齐 */
  useEffect(() => {
    const win = getCurrentWindow();
    return subscribeWindowEdgeSnap(win, { edgePx: 30, debounceMs: 150 });
  }, []);

  function handleSettingsSaved(cfg: AppConfigJson) {
    setShellOpacity(cfg.windowOpacity ?? 1);
    setRootFontSizePx(cfg.fontSizePx ?? DEFAULT_FONT_SIZE_PX);
  }

  return (
    <div
      data-tauri-drag-region
      className="ui-app-glass flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-window)]"
      style={{ opacity: shellOpacity }}
    >
      <div
        data-tauri-drag-region
        className="flex shrink-0 items-center justify-between border-b px-2 py-1.5"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          data-tauri-drag-region
          className="flex flex-1 cursor-grab items-center gap-1.5 select-none"
        >
          <svg
            data-tauri-drag-region
            className="size-[0.8571rem] shrink-0"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-hidden
          >
            <circle cx="3" cy="3" r="1.2" fill="currentColor" />
            <circle cx="9" cy="3" r="1.2" fill="currentColor" />
            <circle cx="3" cy="9" r="1.2" fill="currentColor" />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" />
            <circle cx="3" cy="6" r="1.2" fill="currentColor" />
            <circle cx="9" cy="6" r="1.2" fill="currentColor" />
          </svg>
          <span
            data-tauri-drag-region
            className="text-[0.7857rem]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            任务清单
          </span>
        </div>
        <div className="no-drag flex shrink-0 items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setHistoryOpen(true)}
            className="flex items-center justify-center rounded-[var(--radius-button)] px-2 py-1 text-[0.7857rem] font-medium transition hover:opacity-80"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="历史"
            title="历史"
          >
            历史
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setSettingsOpen(true)}
            className="flex size-7 items-center justify-center rounded-[var(--radius-button)] transition hover:opacity-80"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-label="设置"
            title="设置"
          >
            <svg
              className="size-[1.1429rem]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => void getCurrentWindow().close()}
            className="flex size-7 items-center justify-center rounded-[var(--radius-button)] text-[1.0714rem] font-light leading-none transition hover:opacity-80"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-label="关闭窗口"
            title="关闭"
          >
            ×
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <TaskBoard />
      </div>
      <HistoryDrawer
        open={historyOpen}
        tasks={tasks}
        onClose={() => setHistoryOpen(false)}
      />
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSettingsSaved}
      />
    </div>
  );
}
