"use client";

import TaskItem from "@/components/tasks/TaskItem";
import type { Todo } from "@/types";

interface TaskListProps {
  todos: Todo[];
  loading: boolean;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onStartPomodoro?: (todoId: string) => void;
}

export default function TaskList({
  todos,
  loading,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onStartPomodoro,
}: TaskListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-cyan-100/80 bg-white/70 p-4 shadow-sm dark:border-cyan-900/40 dark:bg-slate-900/70">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cyan-200 bg-white/70 p-8 text-center shadow-sm dark:border-cyan-900/40 dark:bg-slate-900/70">
        <svg className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">No tasks in this flow yet.</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Create a task to start shaping your focused river.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {todos.map((todo) => (
        <TaskItem
          key={todo._id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onStartPomodoro={onStartPomodoro}
        />
      ))}
    </ul>
  );
}
