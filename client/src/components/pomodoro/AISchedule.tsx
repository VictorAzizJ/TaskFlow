"use client";

import type { PomodoroType, TodoPriority } from "@/types";

interface ScheduleBlock {
  order: number;
  type: PomodoroType;
  duration: number;
  taskId: string | null;
  taskTitle: string | null;
  taskPriority: TodoPriority | null;
}

interface AIScheduleProps {
  schedule: ScheduleBlock[];
  loading: boolean;
  error: string | null;
  linkedTodoId: string | null;
  currentPhase: PomodoroType;
  sessionCount: number;
  onRegenerate: () => void;
}

const formatDuration = (seconds: number) => {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
  }
  return `${mins}m`;
};

const getTypeLabel = (type: PomodoroType) => {
  if (type === "work") return "Focus";
  if (type === "shortBreak") return "Short break";
  return "Long break";
};

const getTypeIcon = (type: PomodoroType) => {
  if (type === "work") return "\u25B6";
  if (type === "shortBreak") return "\u23F8";
  return "\u23F9";
};

const priorityBadge: Record<TodoPriority, { label: string; className: string }> = {
  high: {
    label: "High",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  },
  medium: {
    label: "Med",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  },
  low: {
    label: "Low",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
};

const blockTypeStyles: Record<PomodoroType, string> = {
  work: "border-l-cyan-500",
  shortBreak: "border-l-emerald-400",
  longBreak: "border-l-indigo-400",
};

export default function AISchedule({
  schedule,
  loading,
  error,
  linkedTodoId,
  currentPhase,
  sessionCount,
  onRegenerate,
}: AIScheduleProps) {
  const workBlocks = schedule.filter((slot) => slot.type === "work");
  const focusSeconds = workBlocks.reduce((sum, slot) => sum + slot.duration, 0);
  const focusMinutes = Math.round(focusSeconds / 60);
  const totalBlocks = workBlocks.length;

  // Determine which blocks have been completed
  // workBlocks before the current sessionCount index are completed
  const completedWorkCount = Math.min(sessionCount, totalBlocks);

  // Build an index of completed work-block order values
  const completedWorkOrders = new Set(
    workBlocks.slice(0, completedWorkCount).map((b) => b.order)
  );

  // Also track completed breaks (breaks that came before the current position)
  const completedBreakOrders = new Set<number>();
  let workSeen = 0;
  for (const slot of schedule) {
    if (slot.type === "work") {
      workSeen++;
    } else if (workSeen <= completedWorkCount && workSeen > 0) {
      completedBreakOrders.add(slot.order);
    }
  }

  const isSlotCompleted = (slot: ScheduleBlock) => {
    if (slot.type === "work") return completedWorkOrders.has(slot.order);
    return completedBreakOrders.has(slot.order);
  };

  // Find the current active slot
  const findCurrentSlotOrder = () => {
    if (currentPhase === "work") {
      const currentWorkBlock = workBlocks[completedWorkCount];
      return currentWorkBlock?.order ?? null;
    }
    // For break phases, find the first non-completed break
    for (const slot of schedule) {
      if (slot.type !== "work" && !completedBreakOrders.has(slot.order)) {
        return slot.order;
      }
    }
    return null;
  };
  const currentSlotOrder = findCurrentSlotOrder();

  return (
    <section className="rounded-3xl border border-cyan-100/80 bg-white/80 p-5 shadow-md backdrop-blur dark:border-cyan-900/40 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Day Schedule</h2>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-50 dark:border-cyan-800 dark:bg-slate-800 dark:text-cyan-300 dark:hover:bg-slate-700"
        >
          <svg className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
          </svg>
          Regenerate
        </button>
      </div>

      {/* Summary stats row */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDuration(focusSeconds)} focus
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          {totalBlocks} sessions
        </div>
        {completedWorkCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {completedWorkCount} done
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalBlocks > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>Progress</span>
            <span>{Math.round((completedWorkCount / totalBlocks) * 100)}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: `${(completedWorkCount / totalBlocks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : schedule.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
          <svg className="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-sm text-slate-500 dark:text-slate-400">No active tasks to schedule.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Add tasks to generate an AI-powered schedule.</p>
        </div>
      ) : (
        <ol className="mt-4 space-y-1.5">
          {schedule.slice(0, 16).map((slot) => {
            const completed = isSlotCompleted(slot);
            const isCurrent = slot.order === currentSlotOrder;
            const badge = slot.taskPriority ? priorityBadge[slot.taskPriority] : null;

            return (
              <li
                key={`${slot.order}-${slot.type}-${slot.taskId ?? "break"}`}
                className={[
                  "relative rounded-lg border-l-[3px] px-3 py-2.5 text-xs transition",
                  blockTypeStyles[slot.type],
                  isCurrent
                    ? "border border-l-[3px] border-cyan-300 bg-cyan-50/80 shadow-sm dark:border-cyan-700 dark:bg-cyan-950/30"
                    : completed
                      ? "border border-l-[3px] border-slate-200/50 bg-slate-50/50 dark:border-slate-700/50 dark:bg-slate-800/30"
                      : "border border-l-[3px] border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Completion indicator */}
                    {completed ? (
                      <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : isCurrent ? (
                      <span className="relative flex h-4 w-4 flex-shrink-0 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-30" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
                      </span>
                    ) : (
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[10px] text-slate-400 dark:text-slate-500">
                        {getTypeIcon(slot.type)}
                      </span>
                    )}

                    <span className={`font-semibold ${completed ? "text-slate-400 line-through dark:text-slate-500" : isCurrent ? "text-cyan-800 dark:text-cyan-200" : "text-slate-700 dark:text-slate-200"}`}>
                      {getTypeLabel(slot.type)}
                    </span>

                    {badge && slot.type === "work" && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}

                    {isCurrent && (
                      <span className="rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Now
                      </span>
                    )}
                  </div>

                  <span className={`tabular-nums ${completed ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400"}`}>
                    {formatDuration(slot.duration)}
                  </span>
                </div>

                {slot.taskTitle && (
                  <p className={`mt-1 pl-6 ${completed ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-600 dark:text-slate-300"}`}>
                    {slot.taskTitle}
                  </p>
                )}
                {!slot.taskTitle && slot.type !== "work" && (
                  <p className={`mt-1 pl-6 italic ${completed ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400"}`}>
                    Recovery break
                  </p>
                )}
              </li>
            );
          })}

          {schedule.length > 16 && (
            <li className="px-3 py-2 text-center text-xs text-slate-400 dark:text-slate-500">
              +{schedule.length - 16} more blocks
            </li>
          )}
        </ol>
      )}
    </section>
  );
}
