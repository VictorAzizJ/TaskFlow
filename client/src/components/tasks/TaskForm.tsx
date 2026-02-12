"use client";

import { useState } from "react";
import api from "@/services/api";
import type { Todo, TodoPriority } from "@/types";
import type { TodoInput } from "@/hooks/useTodos";

interface TaskFormProps {
  open: boolean;
  mode: "create" | "edit";
  initialTodo?: Todo | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: TodoInput) => Promise<void>;
}

interface FormValues {
  title: string;
  description: string;
  priority: TodoPriority;
  dueDate: string;
  tags: string;
  estimatedPomodoros: string;
}

interface AiEstimateResponse {
  estimate: number;
  reasoning: string;
  source: string;
}

const emptyValues: FormValues = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  tags: "",
  estimatedPomodoros: "",
};

const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
};

const getInitialValues = (mode: "create" | "edit", initialTodo?: Todo | null): FormValues => {
  if (mode === "edit" && initialTodo) {
    return {
      title: initialTodo.title,
      description: initialTodo.description ?? "",
      priority: initialTodo.priority,
      dueDate: toDateInputValue(initialTodo.dueDate),
      tags: initialTodo.tags.join(", "),
      estimatedPomodoros:
        initialTodo.estimatedPomodoros === undefined || initialTodo.estimatedPomodoros === null
          ? ""
          : String(initialTodo.estimatedPomodoros),
    };
  }

  return emptyValues;
};

export default function TaskForm({
  open,
  mode,
  initialTodo,
  submitting,
  onClose,
  onSubmit,
}: TaskFormProps) {
  const [values, setValues] = useState<FormValues>(() => getInitialValues(mode, initialTodo));
  const [error, setError] = useState<string | null>(null);
  const [aiEstimating, setAiEstimating] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<AiEstimateResponse | null>(null);
  const [aiEstimateError, setAiEstimateError] = useState<string | null>(null);
  const titleLabel = mode === "create" ? "Create Task" : "Edit Task";

  if (!open) {
    return null;
  }

  const handleChange = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Clear AI estimate when title/description/priority changes
    if (field === "title" || field === "description" || field === "priority") {
      setAiEstimate(null);
      setAiEstimateError(null);
    }
  };

  const handleAiEstimate = async () => {
    if (!values.title.trim()) {
      setAiEstimateError("Enter a task title first.");
      return;
    }

    setAiEstimating(true);
    setAiEstimateError(null);
    setAiEstimate(null);

    try {
      const response = await api.post<AiEstimateResponse>("/ai/estimate", {
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
      });

      const result = response.data;
      setAiEstimate(result);
      // Auto-fill the estimate
      setValues((current) => ({
        ...current,
        estimatedPomodoros: String(result.estimate),
      }));
    } catch {
      setAiEstimateError("Unable to get AI estimate right now. You can enter one manually.");
    } finally {
      setAiEstimating(false);
    }
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!values.title.trim()) {
      setError("Task title is required.");
      return;
    }

    const parsedEstimate = values.estimatedPomodoros.trim()
      ? Number(values.estimatedPomodoros)
      : null;

    if (
      parsedEstimate !== null &&
      (!Number.isInteger(parsedEstimate) || parsedEstimate < 0 || parsedEstimate > 20)
    ) {
      setError("Estimated pomodoros must be a whole number between 0 and 20.");
      return;
    }

    const payload: TodoInput = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      priority: values.priority,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      estimatedPomodoros: parsedEstimate,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch {
      setError("Unable to save task right now. Try again in a moment.");
    }
  };

  const estimateMinutes = aiEstimate ? aiEstimate.estimate * 25 : null;
  const estimateHours = estimateMinutes && estimateMinutes >= 60
    ? `${Math.floor(estimateMinutes / 60)}h ${estimateMinutes % 60}min`
    : estimateMinutes
      ? `${estimateMinutes}min`
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submitForm}
        className="w-full max-w-2xl rounded-3xl border border-cyan-200/60 bg-gradient-to-br from-white via-cyan-50/80 to-blue-100/60 p-6 shadow-xl dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/40"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{titleLabel}</h2>
          <button
            type="button"
            onClick={() => {
              setError(null);
              onClose();
            }}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 transition hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/80"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Title
            <input
              value={values.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="Draft API architecture doc"
              className="mt-1 w-full rounded-xl border border-cyan-200 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Description
            <textarea
              value={values.description}
              onChange={(event) => handleChange("description", event.target.value)}
              rows={3}
              placeholder="Break down the outcome and acceptance criteria."
              className="mt-1 w-full rounded-xl border border-cyan-200 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Priority
              <select
                value={values.priority}
                onChange={(event) => handleChange("priority", event.target.value as TodoPriority)}
                className="mt-1 w-full rounded-xl border border-cyan-200 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Due date
              <input
                type="date"
                value={values.dueDate}
                onChange={(event) => handleChange("dueDate", event.target.value)}
                className="mt-1 w-full rounded-xl border border-cyan-200 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
              />
            </label>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Estimated pomodoros
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={values.estimatedPomodoros}
                  onChange={(event) => handleChange("estimatedPomodoros", event.target.value)}
                  placeholder="3"
                  className="mt-1 w-full rounded-xl border border-cyan-200 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
                />
              </label>
            </div>
          </div>

          {/* AI Estimate Section */}
          <div className="rounded-xl border border-cyan-200/60 bg-white/60 px-4 py-3 dark:border-cyan-900/30 dark:bg-slate-800/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  AI Time Estimate
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleAiEstimate()}
                disabled={aiEstimating || !values.title.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiEstimating ? (
                  <>
                    <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Estimating...
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Get AI Estimate
                  </>
                )}
              </button>
            </div>

            {aiEstimate && (
              <div className="mt-2.5 rounded-lg border border-cyan-100 bg-cyan-50/80 px-3 py-2 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-cyan-500 px-2 py-0.5 text-[11px] font-bold text-white">
                    ~{aiEstimate.estimate} pomodoro{aiEstimate.estimate !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[11px] text-cyan-700 dark:text-cyan-300">
                    (about {estimateHours})
                  </span>
                  {aiEstimate.source === "openrouter" && (
                    <span className="rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-700 dark:from-cyan-950/40 dark:to-blue-950/40 dark:text-cyan-300">
                      AI
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {aiEstimate.reasoning}
                </p>
              </div>
            )}

            {aiEstimateError && (
              <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-300">{aiEstimateError}</p>
            )}

            {!aiEstimate && !aiEstimateError && !aiEstimating && (
              <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                Enter a title and description, then click to get an AI-powered estimate.
              </p>
            )}
          </div>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Tags (comma separated)
            <input
              value={values.tags}
              onChange={(event) => handleChange("tags", event.target.value)}
              placeholder="deep-work, frontend"
              className="mt-1 w-full rounded-xl border border-cyan-200 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              onClose();
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : mode === "create" ? "Create Task" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
