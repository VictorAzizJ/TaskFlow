"use client";

interface PomodoroSettingsState {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakEvery: number;
  smartBreaksEnabled: boolean;
  autoFlowEnabled: boolean;
  autoAssignTasks: boolean;
  aiEstimatesEnabled: boolean;
  dailySessionGoal: number;
}

interface PomodoroSettingsProps {
  settings: PomodoroSettingsState;
  onUpdate: (patch: Partial<PomodoroSettingsState>) => void;
}

const toMinutes = (seconds: number) => Math.round(seconds / 60);

export default function PomodoroSettings({ settings, onUpdate }: PomodoroSettingsProps) {
  return (
    <section className="rounded-3xl border border-cyan-100/80 bg-white/80 p-5 shadow-md backdrop-blur dark:border-cyan-900/40 dark:bg-slate-900/70">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pomodoro Settings</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Work (minutes)
          <input
            type="number"
            min={1}
            value={toMinutes(settings.workDuration)}
            onChange={(event) =>
              onUpdate({ workDuration: Math.max(60, Number(event.target.value || 1) * 60) })
            }
            className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
          />
        </label>

        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Short break (minutes)
          <input
            type="number"
            min={1}
            value={toMinutes(settings.shortBreakDuration)}
            onChange={(event) =>
              onUpdate({ shortBreakDuration: Math.max(60, Number(event.target.value || 1) * 60) })
            }
            className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
          />
        </label>

        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Long break (minutes)
          <input
            type="number"
            min={1}
            value={toMinutes(settings.longBreakDuration)}
            onChange={(event) =>
              onUpdate({ longBreakDuration: Math.max(60, Number(event.target.value || 1) * 60) })
            }
            className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
          />
        </label>

        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Long break every
          <input
            type="number"
            min={2}
            max={8}
            value={settings.longBreakEvery}
            onChange={(event) => onUpdate({ longBreakEvery: Math.max(2, Number(event.target.value || 2)) })}
            className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-700 dark:text-slate-200">
        <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          Smart breaks
          <input
            type="checkbox"
            checked={settings.smartBreaksEnabled}
            onChange={(event) => onUpdate({ smartBreaksEnabled: event.target.checked })}
            className="h-4 w-4 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
          />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          Auto-flow
          <input
            type="checkbox"
            checked={settings.autoFlowEnabled}
            onChange={(event) => onUpdate({ autoFlowEnabled: event.target.checked })}
            className="h-4 w-4 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
          />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          Auto-assign tasks
          <input
            type="checkbox"
            checked={settings.autoAssignTasks}
            onChange={(event) => onUpdate({ autoAssignTasks: event.target.checked })}
            className="h-4 w-4 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
          />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          AI estimates on new tasks
          <input
            type="checkbox"
            checked={settings.aiEstimatesEnabled}
            onChange={(event) => onUpdate({ aiEstimatesEnabled: event.target.checked })}
            className="h-4 w-4 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
          />
        </label>
      </div>

      <label className="mt-4 block text-xs font-medium text-slate-600 dark:text-slate-300">
        Daily session goal
        <input
          type="number"
          min={1}
          value={settings.dailySessionGoal}
          onChange={(event) => onUpdate({ dailySessionGoal: Math.max(1, Number(event.target.value || 1)) })}
          className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-500"
        />
      </label>
    </section>
  );
}
