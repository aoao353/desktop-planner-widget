import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { Priority, Tag, Task } from "../stores/useTaskStore";
import {
  type DayHistoryRow,
  buildDayHistory,
  buildDayTaskMap,
  formatHistoryDateLabel,
  rateToLevel,
} from "../lib/historyUtils";

type Props = {
  open: boolean;
  tasks: Task[];
  onClose: () => void;
};

const WEEKS = 18; // 展示最近 18 周
const HEAT_COLORS_LIGHT = [
  "#f1efe8",
  "#c0dd97",
  "#639922",
  "#3b6d11",
  "#173404",
];
const HEAT_COLORS_DARK = [
  "#2a2826",
  "#1a4034",
  "#1d6b50",
  "#1d9e75",
  "#5dcaa5",
];
const PRI_COLORS: Record<Priority, string> = {
  urgent: "#c0392b",
  high: "#c96442",
  normal: "#2e6da4",
  low: "#888780",
};
const TAG_LABELS: Record<Tag, string> = {
  work: "工作",
  design: "设计",
  personal: "个人",
};

function buildWeekGrid(): Array<Array<{ date: string; isFuture: boolean }>> {
  const today = new Date();
  const totalDays = WEEKS * 7;
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  // 对齐到周日
  start.setDate(start.getDate() - start.getDay());

  const weeks: Array<Array<{ date: string; isFuture: boolean }>> = [];
  for (let w = 0; w < WEEKS + 2; w++) {
    const week = [];
    for (let wd = 0; wd < 7; wd++) {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7 + wd);
      const ymd = d.toISOString().slice(0, 10);
      week.push({ date: ymd, isFuture: d > today });
    }
    weeks.push(week);
  }
  return weeks;
}

function computeStreak(dayHistoryMap: Map<string, DayHistoryRow>): number {
  const now = new Date();
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ymd = d.toISOString().slice(0, 10);
    const row = dayHistoryMap.get(ymd);
    if (row && row.completedCount > 0) streak++;
    else break;
  }
  return streak;
}

const HEATMAP_EDGE_PX = 48;
const HEATMAP_MAX_SCROLL_SPEED = 6;

export function HistoryDrawer({ open, tasks, onClose }: Props) {
  const heatmapScrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  function handleHeatmapMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = heatmapScrollRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const EDGE = HEATMAP_EDGE_PX;
    const MAX_SPEED = HEATMAP_MAX_SCROLL_SPEED;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    let speed = 0;
    if (x < EDGE) {
      speed = -MAX_SPEED * (1 - x / EDGE);
    } else if (x > width - EDGE) {
      speed = MAX_SPEED * (1 - (width - x) / EDGE);
    }

    if (speed === 0) return;

    function scroll() {
      const node = heatmapScrollRef.current;
      if (!node) {
        rafRef.current = null;
        return;
      }
      node.scrollLeft += speed;
      rafRef.current = requestAnimationFrame(scroll);
    }
    rafRef.current = requestAnimationFrame(scroll);
  }

  function handleHeatmapMouseLeave() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const el = heatmapScrollRef.current;
      if (el) {
        el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      }
    }, 50);
    return () => window.clearTimeout(t);
  }, [open]);

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const heatColors = isDark ? HEAT_COLORS_DARK : HEAT_COLORS_LIGHT;

  const dayHistoryMap = useMemo(() => {
    const rows = buildDayHistory(tasks);
    return new Map(rows.map((r) => [r.date, r]));
  }, [tasks]);

  const dayTaskMap = useMemo(() => buildDayTaskMap(tasks), [tasks]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const weeks = useMemo(() => buildWeekGrid(), []);

  const streak = useMemo(() => computeStreak(dayHistoryMap), [dayHistoryMap]);

  const selectedRow = selectedDate
    ? dayHistoryMap.get(selectedDate)
    : undefined;
  const selectedDayTasks = selectedDate
    ? dayTaskMap.get(selectedDate)
    : undefined;

  useEffect(() => {
    if (!open) setSelectedDate(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  const panelStyle = {
    background: "var(--color-surface-elevated)",
    borderColor: "var(--color-border)",
    borderBottom: "none",
  };

  const completedTotal = tasks.filter((t) => t.done).length;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="history-backdrop"
            type="button"
            aria-label="关闭"
            className="no-drag fixed inset-0 z-40 cursor-default backdrop-blur-[2px]"
            style={{ background: "var(--color-backdrop)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="history-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
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
                id="history-title"
                className="ui-text-primary mb-4 text-center text-[1.0714rem] font-semibold"
              >
                历史
              </h2>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "已完成", value: completedTotal },
                  { label: "活跃天数", value: dayHistoryMap.size },
                  { label: "连续完成", value: `${streak} 天` },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      background: "var(--color-surface-muted)",
                      borderRadius: "var(--radius-card)",
                      padding: "6px 10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.6786rem",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: "1.2857rem",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                ref={heatmapScrollRef}
                onMouseMove={handleHeatmapMouseMove}
                onMouseLeave={handleHeatmapMouseLeave}
                className="[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                  cursor: "default",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
                  maskImage:
                    "linear-gradient(to right, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 3,
                    marginBottom: 4,
                    paddingLeft: 20,
                  }}
                >
                  {weeks.map((week, wi) => {
                    const mon = new Date(
                      `${week[0].date}T12:00:00`,
                    ).getMonth();
                    const prevWeek = wi > 0 ? weeks[wi - 1] : undefined;
                    const prevMon =
                      prevWeek && prevWeek[0]
                        ? new Date(`${prevWeek[0].date}T12:00:00`).getMonth()
                        : null;
                    const showLabel = prevMon === null || mon !== prevMon;
                    return (
                      <div
                        key={wi}
                        style={{
                          width: 13,
                          flexShrink: 0,
                          fontSize: 10,
                          color: "var(--color-text-tertiary)",
                          lineHeight: "12px",
                          textAlign: "center",
                          overflow: "hidden",
                        }}
                      >
                        {showLabel ? `${mon + 1}月` : ""}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      marginRight: 4,
                    }}
                  >
                    {["日", "一", "二", "三", "四", "五", "六"].map(
                      (wd, i) => (
                        <div
                          key={i}
                          style={{
                            width: 13,
                            height: 13,
                            fontSize: 11,
                            color: "var(--color-text-tertiary)",
                            lineHeight: "13px",
                            visibility: [1, 3, 5].includes(i)
                              ? "visible"
                              : "hidden",
                          }}
                        >
                          {wd}
                        </div>
                      ),
                    )}
                  </div>
                  {weeks.map((week, wi) => (
                    <div
                      key={wi}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      {week.map(({ date, isFuture }) => {
                        const row = dayHistoryMap.get(date);
                        const level = row
                          ? rateToLevel(row.completedCount, row.totalCount)
                          : 0;
                        const isSelected = date === selectedDate;
                        return (
                          <div
                            key={date}
                            role="button"
                            tabIndex={isFuture ? -1 : 0}
                            onClick={() =>
                              !isFuture && setSelectedDate(date)
                            }
                            onKeyDown={(e) => {
                              if (isFuture) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedDate(date);
                              }
                            }}
                            style={{
                              width: 13,
                              height: 13,
                              borderRadius: 3,
                              flexShrink: 0,
                              background: isFuture
                                ? heatColors[0]
                                : heatColors[level],
                              border: isSelected
                                ? "1.5px solid var(--color-text-primary)"
                                : "1.5px solid transparent",
                              cursor: isFuture ? "default" : "pointer",
                              transition: "transform 0.1s",
                            }}
                            onMouseEnter={(e) => {
                              if (!isFuture)
                                (e.currentTarget as HTMLElement).style.transform =
                                  "scale(1.3)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.transform =
                                "scale(1)";
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    少
                  </span>
                  {heatColors.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: 3,
                        background: c,
                      }}
                    />
                  ))}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    多
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {selectedDate ? (
                  <motion.div
                    key={selectedDate}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      marginTop: 12,
                      border: "0.5px solid var(--color-border)",
                      borderRadius: "var(--radius-card)",
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8571rem",
                        fontWeight: 500,
                        marginBottom: 8,
                      }}
                    >
                      {formatHistoryDateLabel(selectedDate)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                        fontSize: "0.8571rem",
                      }}
                    >
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        完成{" "}
                        <span
                          className="tabular-nums font-semibold"
                          style={{ color: "var(--color-done)" }}
                        >
                          {selectedRow?.completedCount ?? 0}
                        </span>
                        {" / "}
                        <span className="tabular-nums">
                          {selectedRow?.totalCount ?? 0}
                        </span>
                      </span>
                      <span
                        className="tabular-nums font-semibold"
                        style={{
                          marginLeft: "auto",
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: "var(--color-surface-muted)",
                          color: "var(--color-brand)",
                          fontSize: "0.7857rem",
                        }}
                      >
                        {selectedRow?.rate ?? 0}%
                      </span>
                    </div>
                    {(selectedDayTasks ?? []).map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: "0.8571rem",
                          padding: "3px 0",
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: PRI_COLORS[t.priority],
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            textDecoration: t.done
                              ? "line-through"
                              : "none",
                            color: t.done
                              ? "var(--color-text-tertiary)"
                              : "var(--color-text-primary)",
                          }}
                        >
                          {t.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7143rem",
                            padding: "1px 6px",
                            borderRadius: 10,
                            background: "var(--color-surface-muted)",
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          {TAG_LABELS[t.tag]}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      marginTop: 12,
                      textAlign: "center",
                      fontSize: "0.8571rem",
                      color: "var(--color-text-tertiary)",
                      padding: "12px 0",
                    }}
                  >
                    点击格子查看当天任务
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
