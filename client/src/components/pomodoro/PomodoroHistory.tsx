"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import type { PomodoroSession } from "@/types";

interface PomodoroHistoryProps {
  refreshTick: number;
}

interface SessionsResponse {
  sessions: PomodoroSession[];
}

interface StatsResponse {
  stats: {
    totalSessions: number;
    completedSessions: number;
    interruptedSessions: number;
    totalFocusSeconds: number;
    completionRate: number;
  };
}

const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (!remainder) {
    return `${mins}m`;
  }
  return `${mins}m ${remainder}s`;
};

const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export default function PomodoroHistory({ refreshTick }: PomodoroHistoryProps) {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [focusSecondsWeek, setFocusSecondsWeek] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const [sessionsResponse, statsResponse] = await Promise.all([
          api.get<SessionsResponse>("/pomodoro/sessions", { params: { limit: 80, page: 1 } }),
          api.get<StatsResponse>("/pomodoro/stats", {
            params: { from: weekStart.toISOString(), to: new Date().toISOString() },
          }),
        ]);

        setSessions(sessionsResponse.data.sessions ?? []);
        setFocusSecondsWeek(statsResponse.data.stats?.totalFocusSeconds ?? 0);
        setCompletionRate(statsResponse.data.stats?.completionRate ?? 0);
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Unable to load session history.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [refreshTick]);

  const sessionsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sessions.filter((session) => dayKey(session.completedAt) === today);
  }, [sessions]);

  const chartData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - index));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    return days.map((date) => {
      const key = date.toISOString().slice(0, 10);
      const count = sessions.filter(
        (session) =>
          dayKey(session.completedAt) === key && session.type === "work" && !session.interrupted
      ).length;
      return {
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      };
    });
  }, [sessions]);

  const maxCount = Math.max(...chartData.map((item) => item.count), 1);
  const interrupted = sessionsToday.filter((session) => session.interrupted).length;
  const completed = sessionsToday.length - interrupted;

  return (
    <section className="rounded-3xl border border-cyan-100/80 bg-white/80 p-5 shadow-md backdrop-blur dark:border-cyan-900/40 dark:bg-slate-900/70">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pomodoro History</h2>

      {loading ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Loading history...</p>
      ) : error ? (
        <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-cyan-50 px-3 py-2 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
              Week focus: <span className="font-semibold">{formatDuration(focusSecondsWeek)}</span>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              Today completed: <span className="font-semibold">{completed}</span>
            </div>
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              Today interrupted: <span className="font-semibold">{interrupted}</span>
            </div>
            <div className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
              Completion rate: <span className="font-semibold">{completionRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Last 7 days</p>
            <div className="grid grid-cols-7 gap-2">
              {chartData.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <div className="flex h-20 w-full items-end rounded bg-slate-100 p-1 dark:bg-slate-800">
                    <div
                      className="w-full rounded bg-cyan-500"
                      style={{ height: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              Today&apos;s sessions
            </p>
            <ul className="space-y-2">
              {sessionsToday.slice(0, 8).map((session) => (
                <li
                  key={session._id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700"
                >
                  <span className="text-slate-700 dark:text-slate-200">
                    {session.type} {session.interrupted ? "(interrupted)" : ""}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(session.completedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    - {formatDuration(session.duration)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
