/** 与 Rust `AppConfig` 的 JSON（camelCase）一致 */
export type AppConfigJson = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  globalShortcut: string;
  autostart: boolean;
  windowOpacity: number;
  alwaysOnTop: boolean;
  /** 根字号 px，12–18 */
  fontSizePx: number;
};

export type SaveAppSettingsPayload = {
  globalShortcut: string;
  autostart: boolean;
  windowOpacity: number;
  alwaysOnTop: boolean;
  fontSizePx: number;
};
