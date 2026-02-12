"use client";

import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/auth/RequireAuth";
import { useTodos, type TodoInput, type TodoSortField, type TodoSortOrder, type TodoStatusFilter } from "@/hooks/useTodos";
import { usePomodoro } from "@/hooks/usePomodoro";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import PomodoroTimer from "@/components/pomodoro/PomodoroTimer";
import PomodoroSettings from "@/components/pomodoro/PomodoroSettings";
import PomodoroHistory from "@/components/pomodoro/PomodoroHistory";
import AISchedule from "@/components/pomodoro/AISchedule";
import AIInsights from "@/components/pomodoro/AIInsights";
import type { Todo } from "@/types";
import { useMemo, useState } from "react";

function DashboardContent() {
  const { user, logout } = useAuth();
  const { todos, filters, loading, saving, error, taskCounts, fetchTodos, createTodo, updateTodo, toggleTodo, deleteTodo, archiveTodo } =
    useTodos();
  const pomodoro = usePomodoro(todos, () => fetchTodos());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const handleLogout = async () => {
    await logout();
  };

  const subtitle = useMemo(() => {
    if (!user?.email) {
      return "Flow into focused work.";
    }
    return `Welcome back, ${user.email}. Keep your focus river moving.`;
  }, [user?.email]);

  const openCreateForm = () => {
    setFormMode("create");
    setEditingTodo(null);
    setIsFormOpen(true);
  };

  const openEditForm = (todo: Todo) => {
    setFormMode("edit");
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmitTask = async (payload: TodoInput) => {
    if (formMode === "create") {
      await createTodo(payload);
      return;
    }

    if (editingTodo) {
      await updateTodo(editingTodo._id, payload);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    const shouldDelete = window.confirm("Delete this task from your flow?");
    if (!shouldDelete) {
      return;
    }
    await deleteTodo(id);
  };

  const handleArchiveTodo = async (id: string) => {
    await archiveTodo(id);
  };

  const handleStatusChange = async (status: TodoStatusFilter) => {
    await fetchTodos({ status });
  };

  const handleSortByChange = async (sortBy: TodoSortField) => {
    await fetchTodos({ sortBy });
  };

  const handleOrderChange = async (order: TodoSortOrder) => {
    await fetchTodos({ order });
  };

  const handleStartPomodoro = (todoId: string) => {
    pomodoro.selectTodo(todoId);
    if (!pomodoro.isRunning) {
      pomodoro.start();
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(103,232,249,0.22),_transparent_55%),linear-gradient(160deg,_#f8fdff_0%,_#e7f4ff_45%,_#d6f0ff_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_52%),linear-gradient(170deg,_#0b1220_0%,_#11213d_45%,_#0a1e33_100%)] sm:px-6">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <header className="rounded-3xl border border-cyan-100/70 bg-white/75 p-6 shadow-md backdrop-blur dark:border-cyan-900/40 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Task River
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-cyan-600 hover:to-blue-600"
              >
                + Add task
              </button>
            </div>
          </header>

          <TaskFilters
            status={filters.status}
            sortBy={filters.sortBy}
            order={filters.order}
            counts={taskCounts}
            onStatusChange={(status) => void handleStatusChange(status)}
            onSortByChange={(sortBy) => void handleSortByChange(sortBy)}
            onOrderChange={(order) => void handleOrderChange(order)}
          />

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          <TaskList
            todos={todos}
            loading={loading}
            onToggle={(id) => void toggleTodo(id)}
            onEdit={openEditForm}
            onDelete={(id) => void handleDeleteTodo(id)}
            onArchive={(id) => void handleArchiveTodo(id)}
            onStartPomodoro={handleStartPomodoro}
          />
        </div>

        <aside className="space-y-4">
          <PomodoroTimer
            todos={todos}
            phaseLabel={pomodoro.phaseLabel}
            currentPhase={pomodoro.currentPhase}
            timeRemaining={pomodoro.timeRemaining}
            isRunning={pomodoro.isRunning}
            sessionCount={pomodoro.sessionCount}
            dailyGoal={pomodoro.settings.dailySessionGoal}
            autoFlowEnabled={pomodoro.settings.autoFlowEnabled}
            autoAssignEnabled={pomodoro.settings.autoAssignTasks}
            linkedTodoId={pomodoro.linkedTodoId}
            smartBreakReason={pomodoro.smartBreakReason}
            timerError={pomodoro.timerError}
            completionProgress={pomodoro.completionProgress}
            aiRecommendation={pomodoro.aiRecommendation}
            longBreakEvery={pomodoro.settings.longBreakEvery}
            onStart={pomodoro.start}
            onPause={pomodoro.pause}
            onReset={() => void pomodoro.reset()}
            onSkip={pomodoro.skipToNext}
            onLinkedTodoChange={pomodoro.selectTodo}
            onAutoFlowToggle={(value) => pomodoro.updateSettings({ autoFlowEnabled: value })}
            onAutoAssignToggle={(value) => pomodoro.updateSettings({ autoAssignTasks: value })}
          />

          <AISchedule
            schedule={pomodoro.schedule}
            loading={pomodoro.scheduleLoading}
            error={pomodoro.scheduleError}
            linkedTodoId={pomodoro.linkedTodoId}
            currentPhase={pomodoro.currentPhase}
            sessionCount={pomodoro.sessionCount}
            onRegenerate={() => void pomodoro.refreshSchedule()}
          />

          <AIInsights refreshTick={pomodoro.historyRefreshTick} />

          <PomodoroSettings
            settings={pomodoro.settings}
            onUpdate={(patch) => pomodoro.updateSettings(patch)}
          />

          <PomodoroHistory refreshTick={pomodoro.historyRefreshTick} />

          <section className="rounded-3xl border border-cyan-100/80 bg-white/75 p-5 shadow-md backdrop-blur dark:border-cyan-900/40 dark:bg-slate-900/70">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Current Flow</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p>
                <span className="font-semibold text-cyan-700 dark:text-cyan-300">{taskCounts.all}</span>{" "}
                total tasks
              </p>
              <p>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {taskCounts.active}
                </span>{" "}
                active in your stream
              </p>
              <p>
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {taskCounts.completed}
                </span>{" "}
                completed milestones
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-cyan-100/80 bg-white/75 p-5 shadow-md backdrop-blur dark:border-cyan-900/40 dark:bg-slate-900/70">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Signed in as <span className="font-medium">{user?.email}</span>
            </p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-4 w-full rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-800 dark:bg-slate-800 dark:text-cyan-300 dark:hover:bg-slate-700"
            >
              Log out
            </button>
          </section>
        </aside>
      </section>

      {isFormOpen ? (
        <TaskForm
          key={`${formMode}-${editingTodo?._id ?? "new"}`}
          open={isFormOpen}
          mode={formMode}
          initialTodo={editingTodo}
          submitting={saving}
          onClose={closeForm}
          onSubmit={handleSubmitTask}
        />
      ) : null}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
