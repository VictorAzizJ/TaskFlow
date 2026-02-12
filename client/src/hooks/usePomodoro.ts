"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import type { PomodoroSession, PomodoroType, Todo } from "@/types";

type TimerPhase = PomodoroType;

interface AiTaskRecommendation {
  taskId: string;
  taskTitle: string;
  priority: Todo["priority"];
  dueDate?: string | null;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  score: number;
  remainingPomodoros: number;
}

interface SmartBreakResponse {
  type: "shortBreak" | "longBreak";
  duration: number;
  reason: string;
}

export interface ScheduleBlock {
  order: number;
  type: PomodoroType;
  duration: number;
  taskId: string | null;
  taskTitle: string | null;
  taskPriority: Todo["priority"] | null;
}

interface PomodoroSettings {
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

interface PersistedState {
  settings: PomodoroSettings;
  currentPhase: TimerPhase;
  timeRemaining: number;
  linkedTodoId: string | null;
  sessionCount: number;
}

interface ScheduleResponse {
  schedule: ScheduleBlock[];
}

interface SessionsResponse {
  sessions: PomodoroSession[];
}

const STORAGE_KEY = "taskflow.pomodoro.state.v1";

const defaultSettings: PomodoroSettings = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakEvery: 4,
  smartBreaksEnabled: true,
  autoFlowEnabled: false,
  autoAssignTasks: true,
  aiEstimatesEnabled: true,
  dailySessionGoal: 8,
};

const getDurationByPhase = (phase: TimerPhase, settings: PomodoroSettings) => {
  if (phase === "work") {
    return settings.workDuration;
  }
  if (phase === "shortBreak") {
    return settings.shortBreakDuration;
  }
  return settings.longBreakDuration;
};

const isBreakPhase = (phase: TimerPhase) => phase === "shortBreak" || phase === "longBreak";

const safeJSONParse = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export function usePomodoro(todos: Todo[], onWorkSessionLogged?: () => Promise<void> | void) {
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [currentPhase, setCurrentPhase] = useState<TimerPhase>("work");
  const [timeRemaining, setTimeRemaining] = useState(defaultSettings.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [linkedTodoId, setLinkedTodoId] = useState<string | null>(null);
  const [smartBreakReason, setSmartBreakReason] = useState<string | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AiTaskRecommendation | null>(null);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [historyRefreshTick, setHistoryRefreshTick] = useState(0);
  const [timerError, setTimerError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persisted = safeJSONParse<PersistedState>(window.localStorage.getItem(STORAGE_KEY));
    if (persisted) {
      setSettings({ ...defaultSettings, ...persisted.settings });
      setCurrentPhase(persisted.currentPhase ?? "work");
      setLinkedTodoId(persisted.linkedTodoId ?? null);
      setSessionCount(Number.isFinite(persisted.sessionCount) ? persisted.sessionCount : 0);
      const fallback = getDurationByPhase(persisted.currentPhase ?? "work", {
        ...defaultSettings,
        ...persisted.settings,
      });
      setTimeRemaining(
        Math.max(1, Number.isFinite(persisted.timeRemaining) ? persisted.timeRemaining : fallback)
      );
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const payload: PersistedState = {
      settings,
      currentPhase,
      timeRemaining,
      linkedTodoId,
      sessionCount,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [currentPhase, hydrated, linkedTodoId, sessionCount, settings, timeRemaining]);

  const selectedTodo = useMemo(
    () => todos.find((todo) => todo._id === linkedTodoId) ?? null,
    [linkedTodoId, todos]
  );

  const refreshSchedule = useCallback(async () => {
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const response = await api.get<ScheduleResponse>("/ai/schedule", {
        params: {
          workDuration: settings.workDuration,
          shortBreakDuration: settings.shortBreakDuration,
          longBreakDuration: settings.longBreakDuration,
          longBreakEvery: settings.longBreakEvery,
        },
      });
      setSchedule(response.data.schedule ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load AI schedule.";
      setScheduleError(message);
    } finally {
      setScheduleLoading(false);
    }
  }, [settings.longBreakDuration, settings.longBreakEvery, settings.shortBreakDuration, settings.workDuration]);

  useEffect(() => {
    void refreshSchedule();
  }, [refreshSchedule]);

  const fetchNextTask = useCallback(async () => {
    try {
      const response = await api.get<{ nextTask: AiTaskRecommendation | null }>("/ai/next-task");
      const recommendation = response.data.nextTask;
      setAiRecommendation(recommendation);
      if (recommendation) {
        setLinkedTodoId(recommendation.taskId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch next task.";
      setTimerError(message);
    }
  }, []);

  const moveToWorkPhase = useCallback(async () => {
    setCurrentPhase("work");
    setSmartBreakReason(null);
    setTimeRemaining(settings.workDuration);
    if (settings.autoAssignTasks) {
      await fetchNextTask();
    }
  }, [fetchNextTask, settings.autoAssignTasks, settings.workDuration]);

  const moveToBreakPhase = useCallback(
    async (nextSessionCount: number) => {
      const fallbackType: "shortBreak" | "longBreak" =
        nextSessionCount > 0 && nextSessionCount % settings.longBreakEvery === 0
          ? "longBreak"
          : "shortBreak";

      if (!settings.smartBreaksEnabled) {
        setCurrentPhase(fallbackType);
        setTimeRemaining(
          fallbackType === "longBreak" ? settings.longBreakDuration : settings.shortBreakDuration
        );
        setSmartBreakReason(null);
        return;
      }

      try {
        const response = await api.get<SmartBreakResponse>("/ai/smart-break", {
          params: {
            currentSessionCount: nextSessionCount,
            hour: new Date().getHours(),
            shortBreakDuration: settings.shortBreakDuration,
            longBreakDuration: settings.longBreakDuration,
            longBreakEvery: settings.longBreakEvery,
          },
        });
        setCurrentPhase(response.data.type);
        setTimeRemaining(response.data.duration);
        setSmartBreakReason(response.data.reason);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to calculate smart break.";
        setTimerError(message);
        setCurrentPhase(fallbackType);
        setTimeRemaining(
          fallbackType === "longBreak" ? settings.longBreakDuration : settings.shortBreakDuration
        );
      }
    },
    [
      settings.longBreakDuration,
      settings.longBreakEvery,
      settings.shortBreakDuration,
      settings.smartBreaksEnabled,
    ]
  );

  const logCompletedSession = useCallback(
    async (phase: TimerPhase, plannedDuration: number, interrupted = false) => {
      await api.post("/pomodoro/sessions", {
        todoId: phase === "work" ? linkedTodoId : null,
        type: phase,
        duration: plannedDuration,
        plannedDuration,
        interrupted,
        completedAt: new Date().toISOString(),
      });

      setHistoryRefreshTick((value) => value + 1);

      if (phase === "work" && !interrupted) {
        if (onWorkSessionLogged) {
          await onWorkSessionLogged();
        }
        void refreshSchedule();
      }
    },
    [linkedTodoId, onWorkSessionLogged, refreshSchedule]
  );

  const playChime = useCallback(() => {
    const context = new window.AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 740;
    gainNode.gain.value = 0.09;

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.22);
    oscillator.onended = () => {
      void context.close();
    };
  }, []);

  const notifySessionChange = useCallback((phase: TimerPhase) => {
    const label = phase === "work" ? "Focus session complete" : "Break complete";

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        void new Notification("TaskFlow Pomodoro", { body: label });
      } else if (Notification.permission !== "denied") {
        void Notification.requestPermission();
      }
    }
  }, []);

  const completeCurrentPhase = useCallback(async () => {
    setIsRunning(false);
    setTimerError(null);
    const plannedDuration = getDurationByPhase(currentPhase, settings);

    try {
      await logCompletedSession(currentPhase, plannedDuration, false);
      playChime();
      notifySessionChange(currentPhase);
      if (currentPhase === "work") {
        const nextCount = sessionCount + 1;
        setSessionCount(nextCount);
        await moveToBreakPhase(nextCount);
      } else {
        await moveToWorkPhase();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to log completed session.";
      setTimerError(message);
      setCurrentPhase("work");
      setTimeRemaining(settings.workDuration);
    } finally {
      setTimeout(() => {
        setIsRunning((currentlyRunning) =>
          currentlyRunning ? currentlyRunning : settings.autoFlowEnabled
        );
      }, 0);
    }
  }, [
    currentPhase,
    logCompletedSession,
    moveToBreakPhase,
    moveToWorkPhase,
    notifySessionChange,
    playChime,
    sessionCount,
    settings,
  ]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeRemaining((current) => {
        if (current <= 1) {
          void completeCurrentPhase();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [completeCurrentPhase, isRunning, timeRemaining]);

  const start = useCallback(() => {
    setTimerError(null);
    setIsRunning(true);
    if (currentPhase === "work" && settings.autoAssignTasks && !linkedTodoId) {
      void fetchNextTask();
    }
  }, [currentPhase, fetchNextTask, linkedTodoId, settings.autoAssignTasks]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(async () => {
    const shouldLogInterrupted =
      currentPhase === "work" &&
      timeRemaining < getDurationByPhase(currentPhase, settings) &&
      timeRemaining > 0;
    setIsRunning(false);
    setCurrentPhase("work");
    setSmartBreakReason(null);
    setTimeRemaining(settings.workDuration);

    if (shouldLogInterrupted) {
      try {
        await logCompletedSession("work", settings.workDuration, true);
      } catch {
        // Interrupted logs are best-effort and should not block reset.
      }
    }
  }, [currentPhase, logCompletedSession, settings, timeRemaining]);

  const skipToNext = useCallback(() => {
    void completeCurrentPhase();
  }, [completeCurrentPhase]);

  const updateSettings = useCallback(
    (patch: Partial<PomodoroSettings>) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        if (next.longBreakEvery < 2) {
          next.longBreakEvery = 2;
        }
        if (next.dailySessionGoal < 1) {
          next.dailySessionGoal = 1;
        }
        next.workDuration = Math.max(60, next.workDuration);
        next.shortBreakDuration = Math.max(60, next.shortBreakDuration);
        next.longBreakDuration = Math.max(60, next.longBreakDuration);
        return next;
      });
      if (!isRunning) {
        setTimeRemaining((currentRemaining) => {
          if (currentRemaining <= 0) {
            return getDurationByPhase(currentPhase, { ...settings, ...patch });
          }
          return currentRemaining;
        });
      }
    },
    [currentPhase, isRunning, settings]
  );

  const selectTodo = useCallback((todoId: string | null) => {
    setLinkedTodoId(todoId);
    setAiRecommendation(null);
  }, []);

  const requestHistory = useCallback(async () => {
    const response = await api.get<SessionsResponse>("/pomodoro/sessions", {
      params: { limit: 100, page: 1 },
    });
    return response.data.sessions ?? [];
  }, []);

  const completionProgress = useMemo(() => {
    const planned = getDurationByPhase(currentPhase, settings);
    return Math.max(0, Math.min(100, ((planned - timeRemaining) / planned) * 100));
  }, [currentPhase, settings, timeRemaining]);

  const phaseLabel =
    currentPhase === "work"
      ? "Focus"
      : currentPhase === "shortBreak"
        ? "Short break"
        : "Long break";

  return {
    hydrated,
    settings,
    updateSettings,
    currentPhase,
    phaseLabel,
    timeRemaining,
    isRunning,
    sessionCount,
    linkedTodoId,
    selectedTodo,
    smartBreakReason,
    aiRecommendation,
    schedule,
    scheduleLoading,
    scheduleError,
    timerError,
    completionProgress,
    historyRefreshTick,
    isBreakPhase: isBreakPhase(currentPhase),
    start,
    pause,
    reset,
    skipToNext,
    selectTodo,
    refreshSchedule,
    requestHistory,
  };
}
