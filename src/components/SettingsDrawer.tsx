import { invoke } from "@tauri-apps/api/core";

import { AnimatePresence, motion } from "framer-motion";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { DEFAULT_FONT_SIZE_PX, setRootFontSizePx } from "../lib/rootFontSize";

import type { AppConfigJson, SaveAppSettingsPayload } from "../types/appConfig";



type Props = {

  open: boolean;

  onClose: () => void;

  /** 保存成功后返回最新配置（用于更新透明度等） */

  onSaved?: (cfg: AppConfigJson) => void;

};



export function SettingsDrawer({ open, onClose, onSaved }: Props) {

  const [globalShortcut, setGlobalShortcut] = useState("");

  const [autostart, setAutostart] = useState(false);

  const [windowOpacity, setWindowOpacity] = useState(100);

  const [alwaysOnTop, setAlwaysOnTop] = useState(false);

  const [fontSizePx, setFontSizePx] = useState(DEFAULT_FONT_SIZE_PX);

  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);



  /** 打开面板时的已保存字号，取消时恢复预览 */

  const baselineFontRef = useRef(DEFAULT_FONT_SIZE_PX);



  useEffect(() => {

    if (!open) return;

    setLoadError(null);

    void invoke<AppConfigJson>("get_app_config")

      .then((cfg) => {

        setGlobalShortcut(cfg.globalShortcut ?? "");

        setAutostart(Boolean(cfg.autostart));

        const op = cfg.windowOpacity ?? 1;

        setWindowOpacity(Math.round(op * 100));

        setAlwaysOnTop(Boolean(cfg.alwaysOnTop));

        const fs = Math.round(cfg.fontSizePx ?? DEFAULT_FONT_SIZE_PX);

        const clamped = Math.min(18, Math.max(12, fs));

        baselineFontRef.current = clamped;

        setFontSizePx(clamped);

        setRootFontSizePx(clamped);

      })

      .catch((e) => setLoadError(String(e)));

  }, [open]);



  function handleDismiss() {

    setRootFontSizePx(baselineFontRef.current);

    onClose();

  }



  async function handleSubmit(e: FormEvent) {

    e.preventDefault();

    if (saving) return;

    setSaving(true);

    try {

      const payload: SaveAppSettingsPayload = {

        globalShortcut: globalShortcut.trim(),

        autostart,

        windowOpacity: Math.min(1, Math.max(0.35, windowOpacity / 100)),

        alwaysOnTop,

        fontSizePx,

      };

      const cfg = await invoke<AppConfigJson>("save_app_settings", { payload });

      baselineFontRef.current = fontSizePx;

      setRootFontSizePx(fontSizePx);

      onSaved?.(cfg);

      onClose();

    } catch (err) {
      setLoadError(String(err));

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

            key="settings-backdrop"

            type="button"

            aria-label="关闭"

            className="no-drag fixed inset-0 z-40 cursor-default backdrop-blur-[2px]"

            style={{ background: "var(--color-backdrop)" }}

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            transition={{ duration: 0.2 }}

            onClick={handleDismiss}

          />

          <motion.div

            key="settings-panel"

            role="dialog"

            aria-modal="true"

            aria-labelledby="settings-title"

            className="no-drag fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-t-[var(--radius-window)] border border-b-0 shadow-2xl backdrop-blur-xl"

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

                id="settings-title"

                className="ui-text-primary mb-4 text-center text-[1.0714rem] font-semibold"

              >

                设置

              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <label className="flex flex-col gap-1.5">

                  <span className="ui-text-secondary text-[0.7857rem] font-medium">

                    字号（{fontSizePx}px）

                  </span>

                  <input

                    type="range"

                    min={12}

                    max={18}

                    step={1}

                    value={fontSizePx}

                    onChange={(e) => {

                      const v = Number(e.target.value);

                      setFontSizePx(v);

                      setRootFontSizePx(v);

                    }}

                    className="w-full accent-[var(--color-brand)]"

                  />

                  <span

                    className="text-[0.7143rem] leading-snug"

                    style={{ color: "var(--color-text-tertiary)" }}

                  >

                    拖动时即时预览；保存后写入配置并随启动恢复。

                  </span>

                </label>



                <label className="flex flex-col gap-1.5">

                  <span className="ui-text-secondary text-[0.7857rem] font-medium">

                    全局快捷键

                  </span>

                  <input

                    value={globalShortcut}

                    onChange={(e) => setGlobalShortcut(e.target.value)}

                    placeholder="留空则不启用；例如 ctrl+alt+p"

                    className={inputClass}

                    autoComplete="off"

                  />

                  <span

                    className="text-[0.7143rem] leading-snug"

                    style={{ color: "var(--color-text-tertiary)" }}

                  >

                    留空表示不注册全局快捷键；填写后保存即注册，与其它软件冲突时可能失败。

                  </span>

                </label>



                <label className="ui-text-secondary flex cursor-pointer items-center gap-2 text-[0.9286rem]">

                  <input

                    type="checkbox"

                    className="ui-checkbox-task size-3.5 rounded border"

                    style={{

                      borderColor: "var(--color-border)",

                      background: "var(--color-surface)",

                    }}

                    checked={autostart}

                    onChange={(e) => setAutostart(e.target.checked)}

                  />

                  开机自启

                </label>



                <label className="flex flex-col gap-1.5">

                  <span className="ui-text-secondary text-[0.7857rem] font-medium">

                    窗口透明度（{windowOpacity}%）

                  </span>

                  <input

                    type="range"

                    min={35}

                    max={100}

                    value={windowOpacity}

                    onChange={(e) =>

                      setWindowOpacity(Number(e.target.value))

                    }

                    className="w-full accent-[var(--color-brand)]"

                  />

                  <span

                    className="text-[0.7143rem] leading-snug"

                    style={{ color: "var(--color-text-tertiary)" }}

                  >

                    仅影响界面内容叠在桌面上的透明感；过低可能不易阅读。

                  </span>

                </label>



                <label className="ui-text-secondary flex cursor-pointer items-center gap-2 text-[0.9286rem]">

                  <input

                    type="checkbox"

                    className="ui-checkbox-task size-3.5 rounded border"

                    style={{

                      borderColor: "var(--color-border)",

                      background: "var(--color-surface)",

                    }}

                    checked={alwaysOnTop}

                    onChange={(e) => setAlwaysOnTop(e.target.checked)}

                  />

                  窗口置顶

                </label>



                {loadError ? (

                  <p

                    className="rounded-[var(--radius-card)] border px-2 py-1.5 text-[0.7857rem]"

                    style={{

                      borderColor: "var(--color-danger)",

                      background: "var(--color-danger-muted)",

                      color: "var(--color-danger)",

                    }}

                  >

                    {loadError}

                  </p>

                ) : null}



                <div className="mt-2 flex gap-2">

                  <button

                    type="button"

                    onClick={handleDismiss}

                    className="ui-btn-ghost flex-1 py-3 text-[1rem] font-medium"

                  >

                    取消

                  </button>

                  <button

                    type="submit"

                    disabled={saving}

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

