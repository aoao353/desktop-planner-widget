import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { TaskBoard } from "./components/TaskBoard";
import { subscribeWindowEdgeSnap } from "./lib/windowEdgeSnap";

export default function App() {
  const [autoStart, setAutoStart] = useState(false);
  const [autostartReady, setAutostartReady] = useState(false);

  useEffect(() => {
    void isEnabled()
      .then((v) => {
        setAutoStart(v);
        setAutostartReady(true);
      })
      .catch(() => setAutostartReady(true));
  }, []);

  /** 拖拽停顿后：窗口靠近工作区边缘 30px 内则吸附对齐 */
  useEffect(() => {
    const win = getCurrentWindow();
    return subscribeWindowEdgeSnap(win, { edgePx: 30, debounceMs: 150 });
  }, []);

  async function onAutostartChange(checked: boolean) {
    try {
      if (checked) {
        await enable();
      } else {
        await disable();
      }
      setAutoStart(await isEnabled());
    } catch {
      setAutoStart(await isEnabled().catch(() => false));
    }
  }

  return (
    <div
      data-tauri-drag-region
      className="ui-app-glass flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-window)]"
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
            width="12"
            height="12"
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
            className="text-[11px]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            任务清单
          </span>
        </div>
        <div className="no-drag flex shrink-0 items-center gap-1.5">
          <label className="ui-text-secondary flex cursor-pointer items-center gap-2 text-[11px]">
            <input
              type="checkbox"
              className="ui-checkbox-task size-3.5 rounded border"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
              }}
              checked={autoStart}
              disabled={!autostartReady}
              onChange={(e) => void onAutostartChange(e.target.checked)}
            />
            开机自启
          </label>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => void getCurrentWindow().close()}
            className="flex size-7 items-center justify-center rounded-[var(--radius-button)] text-[15px] font-light leading-none transition hover:opacity-80"
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
    </div>
  );
}
