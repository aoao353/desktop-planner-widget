import { PhysicalPosition } from "@tauri-apps/api/dpi";
import {
  currentMonitor,
  monitorFromPoint,
  type Window,
} from "@tauri-apps/api/window";

const DEFAULT_EDGE_PX = 30;
const DEFAULT_DEBOUNCE_MS = 150;

/**
 * 若窗口外轮廓距工作区某边 ≤ edgePx，则吸附到该边（拖拽停止后用防抖触发）。
 */
export async function snapWindowToWorkAreaEdges(
  win: Window,
  edgePx = DEFAULT_EDGE_PX,
): Promise<void> {
  const pos = await win.outerPosition();
  const size = await win.outerSize();
  const ox = pos.x;
  const oy = pos.y;
  const ow = size.width;
  const oh = size.height;

  let mon = await currentMonitor();
  if (!mon) {
    const cx = ox + Math.floor(ow / 2);
    const cy = oy + Math.floor(oh / 2);
    mon = await monitorFromPoint(cx, cy);
  }
  if (!mon) return;

  const wx = mon.workArea.position.x;
  const wy = mon.workArea.position.y;
  const ww = mon.workArea.size.width;
  const wh = mon.workArea.size.height;

  const dLeft = ox - wx;
  const dRight = wx + ww - (ox + ow);
  const dTop = oy - wy;
  const dBottom = wy + wh - (oy + oh);

  let nx = ox;
  let ny = oy;

  if (dLeft <= edgePx && dRight <= edgePx) {
    nx = dLeft <= dRight ? wx : wx + ww - ow;
  } else if (dLeft <= edgePx) {
    nx = wx;
  } else if (dRight <= edgePx) {
    nx = wx + ww - ow;
  }

  if (dTop <= edgePx && dBottom <= edgePx) {
    ny = dTop <= dBottom ? wy : wy + wh - oh;
  } else if (dTop <= edgePx) {
    ny = wy;
  } else if (dBottom <= edgePx) {
    ny = wy + wh - oh;
  }

  if (nx !== ox || ny !== oy) {
    await win.setPosition(new PhysicalPosition(nx, ny));
  }
}

/**
 * 订阅窗口移动，在停顿 debounceMs 后尝试边缘吸附；返回卸载函数（同步调用即可取消监听）。
 */
export function subscribeWindowEdgeSnap(
  win: Window,
  options?: { edgePx?: number; debounceMs?: number },
): () => void {
  const edgePx = options?.edgePx ?? DEFAULT_EDGE_PX;
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  let timer: ReturnType<typeof setTimeout> | null = null;

  const unlistenReady = win.onMoved(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void snapWindowToWorkAreaEdges(win, edgePx).catch(() => {
        /* 权限或平台差异时忽略 */
      });
    }, debounceMs);
  });

  return () => {
    if (timer) clearTimeout(timer);
    void unlistenReady.then((unlisten) => unlisten());
  };
}
