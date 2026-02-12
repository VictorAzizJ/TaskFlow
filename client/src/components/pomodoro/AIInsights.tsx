"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/services/api";

interface InsightsSummary {
  totalSessions: number;
  completedSessions: number;
  interruptedSessions: number;
  interruptionRate: number;
  focusHours: number;
  totalTasks: number;
  taskCompletionRate: number;
}

interface InsightsResponse {
  tips: string[];
  summary: InsightsSummary;
  source: string;
  generatedAt: string;
  rangeDays: number;
}

const tipIcons = [
  // Lightbulb
  <svg key="bulb" className="h-5 w-5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
  </svg>,
  // Chart
  <svg key="chart" className="h-5 w-5 flex-shrink-0 text-cyan-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>,
  // Rocket
  <svg key="rocket" className="h-5 w-5 flex-shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>,
];

const tipGradients = [
  "from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-900/40",
  "from-cyan-50 to-blue-50 border-cyan-200 dark:from-cyan-950/20 dark:to-blue-950/20 dark:border-cyan-900/40",
  "from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-950/20 dark:to-purple-950/20 dark:border-indigo-900/40",
];

const formatHours = (hours: number) => {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

interface AIInsightsProps {
  refreshTick?: number;
}

export default function AIInsights({ refreshTick = 0 }: AIInsightsProps) {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<InsightsResponse>("/ai/insights", {
        params: { days: 14 },
      });
      setInsights(response.data);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unable to load AI insights.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights, refreshTick]);

  return (
    <section className="rounded-3xl border border-cyan-100/80 bg-white/80 p-5 shadow-md backdrop-blur dark:border-cyan-900/40 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Insights</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadInsights()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
        >
          <svg className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
          </svg>
          Refresh
        </button>
      </div>

      {loading && !insights ? (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : insights ? (
        <div className="mt-4 space-y-4">
          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 px-3 py-2.5 dark:from-cyan-950/20 dark:to-blue-950/20">
              <p className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400">Focus Time</p>
              <p className="mt-0.5 text-lg font-bold text-cyan-800 dark:text-cyan-200">
                {formatHours(insights.summary.focusHours)}
              </p>
              <p className="text-[10px] text-cyan-500 dark:text-cyan-500">last {insights.rangeDays}d</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2.5 dark:from-emerald-950/20 dark:to-teal-950/20">
              <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Sessions</p>
              <p className="mt-0.5 text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {insights.summary.completedSessions}
              </p>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-500">completed</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 px-3 py-2.5 dark:from-amber-950/20 dark:to-orange-950/20">
              <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Completion</p>
              <p className="mt-0.5 text-lg font-bold text-amber-800 dark:text-amber-200">
                {insights.summary.taskCompletionRate.toFixed(0)}%
              </p>
              <p className="text-[10px] text-amber-500 dark:text-amber-500">task rate</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 px-3 py-2.5 dark:from-indigo-950/20 dark:to-purple-950/20">
              <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">Interrupted</p>
              <p className="mt-0.5 text-lg font-bold text-indigo-800 dark:text-indigo-200">
                {insights.summary.interruptionRate.toFixed(0)}%
              </p>
              <p className="text-[10px] text-indigo-500 dark:text-indigo-500">of sessions</p>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Productivity Tips</p>
            {insights.tips.map((tip, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 rounded-xl border bg-gradient-to-r px-4 py-3 ${tipGradients[index % tipGradients.length]}`}
              >
                {tipIcons[index % tipIcons.length]}
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">{tip}</p>
              </div>
            ))}
          </div>

          {/* Source indicator */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {insights.source === "openrouter" ? (
                <span className="inline-flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Powered by AI
                </span>
              ) : (
                "Based on your activity patterns"
              )}
            </p>
            {insights.generatedAt && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Updated {new Date(insights.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
