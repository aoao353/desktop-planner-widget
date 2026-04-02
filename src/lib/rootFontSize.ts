export const DEFAULT_FONT_SIZE_PX = 14;

const MIN = 12;
const MAX = 18;

/** 将根元素 `font-size` 设为指定 px，并限制在 12–18 */
export function setRootFontSizePx(px: number): void {
  const n = Math.min(MAX, Math.max(MIN, Math.round(px)));
  document.documentElement.style.fontSize = `${n}px`;
}
