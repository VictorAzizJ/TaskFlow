"use client";

import type { TodoSortField, TodoSortOrder, TodoStatusFilter } from "@/hooks/useTodos";

interface TaskCounts {
  all: number;
  active: number;
  completed: number;
}

interface TaskFiltersProps {
  status: TodoStatusFilter;
  sortBy: TodoSortField;
  order: TodoSortOrder;
  counts: TaskCounts;
  onStatusChange: (status: TodoStatusFilter) => void;
  onSortByChange: (sortBy: TodoSortField) => void;
  onOrderChange: (order: TodoSortOrder) => void;
}

const statusOptions: Array<{ value: TodoStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const sortOptions: Array<{ value: TodoSortField; label: string }> = [
  { value: "createdAt", label: "Created" },
  { value: "updatedAt", label: "Updated" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title" },
];

export default function TaskFilters({
  status,
  sortBy,
  order,
  counts,
  onStatusChange,
  onSortByChange,
  onOrderChange,
}: TaskFiltersProps) {
  return (
    <section className="rounded-2xl border border-cyan-100/70 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-cyan-900/40 dark:bg-slate-900/65">
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((option) => {
          const isActive = status === option.value;
          const count = counts[option.value];
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                isActive
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow"
                  : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-slate-800 dark:text-cyan-300 dark:hover:bg-slate-700",
              ].join(" ")}
            >
              {option.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Sort by
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as TodoSortField)}
            className="mt-1 w-full rounded-lg border border-cyan-200 bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Order
          <select
            value={order}
            onChange={(event) => onOrderChange(event.target.value as TodoSortOrder)}
            className="mt-1 w-full rounded-lg border border-cyan-200 bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>
    </section>
  );
}
