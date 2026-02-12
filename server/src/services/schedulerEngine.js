const PRIORITY_WEIGHT = {
  high: 30,
  medium: 20,
  low: 10,
};

const DEFAULT_PREFERENCES = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakEvery: 4,
};

const getDueDateScore = (dueDate) => {
  if (!dueDate) {
    return 0;
  }

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return 0;
  }

  const now = Date.now();
  const diffMs = due.getTime() - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 0) {
    return 35;
  }
  if (diffDays <= 1) {
    return 28;
  }
  if (diffDays <= 3) {
    return 18;
  }
  if (diffDays <= 7) {
    return 10;
  }

  return 0;
};

const getRemainingEstimate = (todo) => {
  const estimated = Number(todo.estimatedPomodoros);
  const completed = Number(todo.completedPomodoros || 0);

  if (Number.isFinite(estimated) && estimated > 0) {
    return Math.max(estimated - completed, 0);
  }

  return Math.max(1 - completed, 0);
};

const scoreTask = (todo) => {
  const priorityScore = PRIORITY_WEIGHT[todo.priority] || PRIORITY_WEIGHT.medium;
  const dueDateScore = getDueDateScore(todo.dueDate);
  const remaining = getRemainingEstimate(todo);
  const remainingScore = remaining * 6;

  return {
    score: priorityScore + dueDateScore + remainingScore,
    remaining,
  };
};

const normalizePreferences = (preferences) => {
  const normalized = { ...DEFAULT_PREFERENCES, ...(preferences || {}) };

  normalized.workDuration = Math.max(60, Number(normalized.workDuration) || DEFAULT_PREFERENCES.workDuration);
  normalized.shortBreakDuration = Math.max(
    60,
    Number(normalized.shortBreakDuration) || DEFAULT_PREFERENCES.shortBreakDuration
  );
  normalized.longBreakDuration = Math.max(
    60,
    Number(normalized.longBreakDuration) || DEFAULT_PREFERENCES.longBreakDuration
  );
  normalized.longBreakEvery = Math.max(2, Number(normalized.longBreakEvery) || DEFAULT_PREFERENCES.longBreakEvery);

  return normalized;
};

const buildDaySchedule = (todos, completedSessions = [], preferences = {}) => {
  const normalizedPreferences = normalizePreferences(preferences);
  const scored = (todos || [])
    .map((todo) => {
      const { score, remaining } = scoreTask(todo);
      return {
        todo,
        score,
        remaining,
      };
    })
    .filter((item) => item.remaining > 0 && !item.todo.completed && !item.todo.archived)
    .sort((a, b) => b.score - a.score);

  const schedule = [];
  let order = 1;
  let workCount = completedSessions.filter(
    (session) => session.type === "work" && session.interrupted === false
  ).length;

  scored.forEach((item) => {
    for (let i = 0; i < item.remaining; i += 1) {
      workCount += 1;
      schedule.push({
        order: order++,
        type: "work",
        duration: normalizedPreferences.workDuration,
        taskId: item.todo._id,
        taskTitle: item.todo.title,
        taskPriority: item.todo.priority,
      });

      const isLongBreak = workCount % normalizedPreferences.longBreakEvery === 0;
      schedule.push({
        order: order++,
        type: isLongBreak ? "longBreak" : "shortBreak",
        duration: isLongBreak
          ? normalizedPreferences.longBreakDuration
          : normalizedPreferences.shortBreakDuration,
        taskId: null,
        taskTitle: null,
        taskPriority: null,
      });
    }
  });

  return schedule;
};

const pickNextTask = (todos, completedSessions = []) => {
  const completedCount = completedSessions.filter(
    (session) => session.type === "work" && session.interrupted === false
  ).length;

  const candidates = (todos || [])
    .filter((todo) => !todo.completed && !todo.archived)
    .map((todo) => {
      const { score, remaining } = scoreTask(todo);
      return {
        todo,
        remaining,
        score: score + Math.min(completedCount, 8),
      };
    })
    .filter((item) => item.remaining > 0)
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) {
    return null;
  }

  const best = candidates[0];
  return {
    taskId: best.todo._id,
    taskTitle: best.todo.title,
    priority: best.todo.priority,
    dueDate: best.todo.dueDate,
    estimatedPomodoros: best.todo.estimatedPomodoros,
    completedPomodoros: best.todo.completedPomodoros,
    score: Number(best.score.toFixed(2)),
    remainingPomodoros: best.remaining,
  };
};

const calculateSmartBreak = ({
  sessionHistory = [],
  currentSessionCount = 0,
  timeOfDay = new Date().getHours(),
  sessionsToday = 0,
  shortBreakDuration = DEFAULT_PREFERENCES.shortBreakDuration,
  longBreakDuration = DEFAULT_PREFERENCES.longBreakDuration,
  longBreakEvery = DEFAULT_PREFERENCES.longBreakEvery,
}) => {
  const isLongBreak = currentSessionCount > 0 && currentSessionCount % longBreakEvery === 0;
  let duration = isLongBreak ? longBreakDuration : shortBreakDuration;
  const reasons = [];

  if (sessionsToday >= 6) {
    duration += 2 * 60;
    reasons.push("extended for fatigue after many sessions");
  }

  const recent = sessionHistory.slice(0, 3);
  const interruptions = recent.filter((session) => session.interrupted).length;
  const interruptionRate = recent.length ? interruptions / recent.length : 0;
  if (interruptionRate > 0.5) {
    duration += 2 * 60;
    reasons.push("extended due to recent interruptions");
  }

  if (timeOfDay >= 14) {
    duration += 60;
    reasons.push("slightly longer afternoon recovery");
  }

  return {
    type: isLongBreak ? "longBreak" : "shortBreak",
    duration,
    reason: reasons.length ? reasons.join("; ") : "standard break duration",
  };
};

module.exports = {
  buildDaySchedule,
  pickNextTask,
  calculateSmartBreak,
};
