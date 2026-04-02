import { useEffect, useState } from "react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { TaskBoard } from "./components/TaskBoard";

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
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      <div className="no-drag flex shrink-0 items-center justify-end gap-2 border-b border-white/[0.06] px-2 py-1.5">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-white/55">
          <input
            type="checkbox"
            className="size-3.5 rounded border-white/25 accent-sky-400"
            checked={autoStart}
            disabled={!autostartReady}
            onChange={(e) => void onAutostartChange(e.target.checked)}
          />
          开机自启
        </label>
      </div>
      <div className="min-h-0 flex-1">
        <TaskBoard />
      </div>
    </div>
  );
}
