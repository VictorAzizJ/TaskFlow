"use client";

import type { Todo } from "@/types";

interface TaskItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onStartPomodoro?: (todoId: string) => void;
}

const priorityStyles: Record<Todo["priority"], string> = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

const formatDueDate = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString();
};

const isDueSoon = (value?: string | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const daysLeft = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysLeft <= 1 && daysLeft >= -1;
};

const isOverdue = (value?: string | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now() - 86400000;
};

export default function TaskItem({ todo, onToggle, onEdit, onDelete, onArchive, onStartPomodoro }: TaskItemProps) {
  const dueDate = formatDueDate(todo.dueDate);
  const dueSoon = isDueSoon(todo.dueDate);
  const overdue = isOverdue(todo.dueDate);

  const hasEstimate = todo.estimatedPomodoros != null && todo.estimatedPomodoros > 0;
  const pomodoroProgress = hasEstimate
    ? Math.min(100, (todo.completedPomodoros / (todo.estimatedPomodoros ?? 1)) * 100)
    : 0;
  const pomodorosRemaining = hasEstimate
    ? Math.max(0, (todo.estimatedPomodoros ?? 0) - todo.completedPomodoros)
    : null;
  const estimatedMinutes = hasEstimate ? (todo.estimatedPomodoros ?? 0) * 25 : null;

  return (
    <li className="rounded-2xl border border-cyan-100/80 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:shadow-md dark:border-cyan-900/40 dark:bg-slate-900/70">
      <div className="flex items-start gap-3">
        <input
          aria-label={`Mark ${todo.title} as completed`}
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo._id)}
          className="mt-1 h-4 w-4 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
        />

        <div className="min-w-0 flex-1">
          {/* Title row with priority badge */}
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={[
                "truncate text-base font-semibold",
                todo.completed
                  ? "text-slate-500 line-through dark:text-slate-400"
                  : "text-slate-900 dark:text-slate-50",
              ].join(" ")}
            >
              {todo.title}
            </h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[todo.priority]}`}>
              {todo.priority}
            </span>
          </div>

          {todo.description ? (
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{todo.description}</p>
          ) : null}

          {/* Info row: due date + pomodoro badge */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Due date badge */}
            {dueDate && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                overdue
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  : dueSoon
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {overdue ? "Overdue" : dueSoon ? "Due soon" : ""} {dueDate}
              </span>
            )}

            {/* Pomodoro estimate badge */}
            {hasEstimate ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {todo.completedPomodoros}/{todo.estimatedPomodoros} poms
                {estimatedMinutes && <span className="text-cyan-500">({estimatedMinutes}min)</span>}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No estimate
              </span>
            )}

            {/* Remaining pomodoros pill */}
            {pomodorosRemaining !== null && pomodorosRemaining > 0 && !todo.completed && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                {pomodorosRemaining} left
              </span>
            )}

            {/* Completed all pomodoros indicator */}
            {hasEstimate && pomodorosRemaining === 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                All sessions done
              </span>
            )}
          </div>

          {/* Pomodoro progress bar */}
          {hasEstimate && !todo.completed && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    pomodoroProgress >= 100
                      ? "bg-emerald-500"
                      : pomodoroProgress >= 50
                        ? "bg-cyan-500"
                        : "bg-cyan-400"
                  }`}
                  style={{ width: `${pomodoroProgress}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                {Math.round(pomodoroProgress)}%
              </span>
            </div>
          )}

          {/* Tags */}
          {todo.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {todo.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-cyan-100/80 px-2 py-0.5 text-[10px] text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {onStartPomodoro && !todo.completed && (
          <button
            type="button"
            onClick={() => onStartPomodoro(todo._id)}
            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Focus
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(todo)}
          className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-800 dark:bg-slate-800 dark:text-cyan-300 dark:hover:bg-slate-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onArchive(todo._id)}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
        >
          Archive
        </button>
        <button
          type="button"
          onClick={() => onDelete(todo._id)}
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
