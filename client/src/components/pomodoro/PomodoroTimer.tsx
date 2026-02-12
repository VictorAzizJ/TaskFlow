"use client";

import type { Todo } from "@/types";

interface Recommendation {
  taskId: string;
  taskTitle: string;
  priority?: Todo["priority"];
  score: number;
  remainingPomodoros: number;
}

interface PomodoroTimerProps {
  todos: Todo[];
  phaseLabel: string;
  currentPhase: "work" | "shortBreak" | "longBreak";
  timeRemaining: number;
  isRunning: boolean;
  sessionCount: number;
  dailyGoal: number;
  autoFlowEnabled: boolean;
  autoAssignEnabled: boolean;
  linkedTodoId: string | null;
  smartBreakReason: string | null;
  timerError: string | null;
  completionProgress: number;
  aiRecommendation: Recommendation | null;
  longBreakEvery: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onLinkedTodoChange: (id: string | null) => void;
  onAutoFlowToggle: (value: boolean) => void;
  onAutoAssignToggle: (value: boolean) => void;
}

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const phaseStyles: Record<PomodoroTimerProps["currentPhase"], { text: string; ring: string; bg: string }> = {
  work: {
    text: "text-cyan-700 dark:text-cyan-300",
    ring: "rgb(14 165 233)",
    bg: "rgb(224 242 254)",
  },
  shortBreak: {
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "rgb(16 185 129)",
    bg: "rgb(209 250 229)",
  },
  longBreak: {
    text: "text-indigo-700 dark:text-indigo-300",
    ring: "rgb(99 102 241)",
    bg: "rgb(224 231 255)",
  },
};

export default function PomodoroTimer({
  todos,
  phaseLabel,
  currentPhase,
  timeRemaining,
  isRunning,
  sessionCount,
  dailyGoal,
  autoFlowEnabled,
  autoAssignEnabled,
  linkedTodoId,
  smartBreakReason,
  timerError,
  completionProgress,
  aiRecommendation,
  longBreakEvery,
  onStart,
  onPause,
  onReset,
  onSkip,
  onLinkedTodoChange,
  onAutoFlowToggle,
  onAutoAssignToggle,
}: PomodoroTimerProps) {
  const style = phaseStyles[currentPhase];
  const progressBackground = `conic-gradient(${style.ring} ${completionProgress}%, ${style.bg} ${completionProgress}% 100%)`;

  // Calculate upcoming long break info
  const sessionsUntilLongBreak = longBreakEvery - ((sessionCount % longBreakEvery) || longBreakEvery);
  const sessionMessage =
    sessionsUntilLongBreak === 0
      ? "Long break coming up next!"
      : sessionsUntilLongBreak === 1
        ? "1 more session until long break"
        : `${sessionsUntilLongBreak} sessions until long break`;

  // Is current task AI-recommended?
  const isAiAssigned = aiRecommendation !== null && linkedTodoId === aiRecommendation.taskId;

  // Find the selected task for display
  const selectedTask = linkedTodoId
    ? todos.find((t) => t._id === linkedTodoId)
    : null;

  return (
    <section className="rounded-3xl border border-cyan-100/80 bg-white/80 p-5 shadow-md backdrop-blur dark:border-cyan-900/40 dark:bg-slate-900/70">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pomodoro Timer</h2>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            currentPhase === "work"
              ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
              : currentPhase === "shortBreak"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
          }`}>
            {phaseLabel}
          </span>
        </div>
      </div>

      {/* Timer Ring */}
      <div className="mt-4 flex justify-center">
        <div
          className="grid h-44 w-44 place-items-center rounded-full p-2 shadow-inner"
          style={{ background: progressBackground }}
          role="progressbar"
          aria-valuenow={Math.round(completionProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Pomodoro progress"
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-white dark:bg-slate-950">
            <div className="text-center">
              <p className="text-4xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatTime(timeRemaining)}
              </p>
              {isRunning && (
                <p className="mt-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {currentPhase === "work" ? "Stay focused" : "Take a breather"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session counter with long break info */}
      <div className="mt-3 text-center">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Session <span className="font-semibold text-cyan-700 dark:text-cyan-300">{sessionCount + 1}</span> of{" "}
          <span className="font-semibold">{dailyGoal}</span> goal today
        </p>
        {currentPhase === "work" && sessionCount > 0 && (
          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
            {sessionMessage}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={isRunning ? onPause : onStart}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition ${
            isRunning
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-cyan-500 hover:bg-cyan-600"
          }`}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
              Pause
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Start
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-800 dark:bg-slate-800 dark:text-cyan-300 dark:hover:bg-slate-700"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
        >
          Skip
        </button>
        <div className="flex flex-col gap-1">
          <label className="flex items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Auto-flow
            <input
              type="checkbox"
              checked={autoFlowEnabled}
              onChange={(event) => onAutoFlowToggle(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
            />
          </label>
          <label className="flex items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Auto-assign
            <input
              type="checkbox"
              checked={autoAssignEnabled}
              onChange={(event) => onAutoAssignToggle(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
            />
          </label>
        </div>
      </div>

      {/* Task selection area */}
      <div className="mt-4 space-y-2">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span>Current task</span>
            {isAiAssigned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI Recommended
              </span>
            )}
          </div>
          <select
            value={linkedTodoId ?? ""}
            onChange={(event) => onLinkedTodoChange(event.target.value || null)}
            className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
          >
            <option value="">No task linked</option>
            {todos
              .filter((todo) => !todo.archived && !todo.completed)
              .map((todo) => (
                <option key={todo._id} value={todo._id}>
                  {todo.title} {todo.estimatedPomodoros ? `(${todo.completedPomodoros}/${todo.estimatedPomodoros} poms)` : ""}
                </option>
              ))}
          </select>
        </label>

        {/* Selected task mini card */}
        {selectedTask && currentPhase === "work" && (
          <div className="rounded-lg border border-cyan-100 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 px-3 py-2 dark:border-cyan-900/40 dark:from-cyan-950/20 dark:to-blue-950/20">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {selectedTask.title}
              </span>
              <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                selectedTask.priority === "high"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                  : selectedTask.priority === "medium"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              }`}>
                {selectedTask.priority}
              </span>
            </div>
            {selectedTask.estimatedPomodoros != null && selectedTask.estimatedPomodoros > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all"
                    style={{
                      width: `${Math.min(100, (selectedTask.completedPomodoros / selectedTask.estimatedPomodoros) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                  {selectedTask.completedPomodoros}/{selectedTask.estimatedPomodoros}
                </span>
              </div>
            )}
          </div>
        )}

        {/* AI Recommendation card */}
        {aiRecommendation && !isAiAssigned && (
          <button
            type="button"
            onClick={() => onLinkedTodoChange(aiRecommendation.taskId)}
            className="w-full rounded-lg border border-cyan-200 bg-cyan-50/80 px-3 py-2 text-left text-xs transition hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/20 dark:hover:bg-cyan-950/40"
          >
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="text-cyan-700 dark:text-cyan-300">
                AI suggests: <span className="font-semibold">{aiRecommendation.taskTitle}</span>
              </span>
            </div>
            <p className="mt-0.5 pl-5 text-[10px] text-cyan-600 dark:text-cyan-400">
              {aiRecommendation.remainingPomodoros} pom{aiRecommendation.remainingPomodoros !== 1 ? "s" : ""} remaining &middot; Click to assign
            </p>
          </button>
        )}

        {/* Smart break indicator */}
        {smartBreakReason && currentPhase !== "work" && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5 dark:border-emerald-900/50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Smart Break</p>
              <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">{smartBreakReason}</p>
            </div>
          </div>
        )}

        {/* Error display */}
        {timerError && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900/50 dark:bg-rose-950/30">
            <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-rose-700 dark:text-rose-300">{timerError}</p>
          </div>
        )}
      </div>
    </section>
  );
}
