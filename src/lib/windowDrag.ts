import { getCurrentWindow } from "@tauri-apps/api/window";
import type { MouseEvent } from "react";

/** 程序化窗口拖拽：避免无焦点 / resize 后声明式 drag-region 失效；需在可交互子元素上 stopPropagation */
export function onWindowDragMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  const win = getCurrentWindow();
  void win.setFocus();
  void win.startDragging();
}
