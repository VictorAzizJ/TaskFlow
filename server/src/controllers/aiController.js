const { validationResult } = require("express-validator");
const Todo = require("../models/Todo");
const PomodoroSession = require("../models/PomodoroSession");
const { estimatePomodoros, generateInsights } = require("../services/aiService");
const {
  buildDaySchedule,
  pickNextTask,
  calculateSmartBreak,
} = require("../services/schedulerEngine");

const getValidationErrors = (req) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return null;
  }

  return result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));
};

const getStartOfDay = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

const getUserActiveTodos = async (userId) =>
  Todo.find({
    userId,
    archived: false,
    completed: false,
  }).sort({ createdAt: -1 });

const getCompletedWorkSessionsToday = async (userId) =>
  PomodoroSession.find({
    userId,
    type: "work",
    interrupted: false,
    completedAt: { $gte: getStartOfDay() },
  }).sort({ completedAt: -1 });

const estimateTask = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { title, description = "", priority = "medium" } = req.body;
    const estimation = await estimatePomodoros({ title, description, priority });

    return res.status(200).json({
      estimate: estimation.estimate,
      reasoning: estimation.reasoning,
      source: estimation.source,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to estimate pomodoros", error: error.message });
  }
};

const getSchedule = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const todos = await getUserActiveTodos(req.user.id);
    const completedSessions = await getCompletedWorkSessionsToday(req.user.id);

    const preferences = {
      workDuration: Number(req.query.workDuration) || undefined,
      shortBreakDuration: Number(req.query.shortBreakDuration) || undefined,
      longBreakDuration: Number(req.query.longBreakDuration) || undefined,
      longBreakEvery: Number(req.query.longBreakEvery) || undefined,
    };

    const schedule = buildDaySchedule(todos, completedSessions, preferences);
    const totalFocusSeconds = schedule
      .filter((slot) => slot.type === "work")
      .reduce((sum, slot) => sum + slot.duration, 0);

    return res.status(200).json({
      schedule,
      meta: {
        generatedAt: new Date().toISOString(),
        activeTasks: todos.length,
        totalBlocks: schedule.length,
        totalFocusSeconds,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate schedule", error: error.message });
  }
};

const getNextTask = async (req, res) => {
  try {
    const todos = await getUserActiveTodos(req.user.id);
    const completedSessions = await getCompletedWorkSessionsToday(req.user.id);
    const recommendation = pickNextTask(todos, completedSessions);

    if (!recommendation) {
      return res.status(200).json({ nextTask: null, message: "No active tasks available" });
    }

    return res.status(200).json({ nextTask: recommendation });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to determine next recommended task", error: error.message });
  }
};

const getSmartBreak = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const currentSessionCount = Number(req.query.currentSessionCount || 0);
    const timeOfDay = Number.isFinite(Number(req.query.hour))
      ? Number(req.query.hour)
      : new Date().getHours();
    const sessionsToday = await PomodoroSession.countDocuments({
      userId: req.user.id,
      type: "work",
      interrupted: false,
      completedAt: { $gte: getStartOfDay() },
    });
    const recentSessions = await PomodoroSession.find({ userId: req.user.id })
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(8);

    const result = calculateSmartBreak({
      sessionHistory: recentSessions,
      currentSessionCount,
      timeOfDay,
      sessionsToday,
      shortBreakDuration: Number(req.query.shortBreakDuration) || undefined,
      longBreakDuration: Number(req.query.longBreakDuration) || undefined,
      longBreakEvery: Number(req.query.longBreakEvery) || undefined,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to calculate smart break duration", error: error.message });
  }
};

const getInsights = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 60);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [sessionHistory, taskHistory] = await Promise.all([
      PomodoroSession.find({ userId: req.user.id, completedAt: { $gte: from } }).sort({
        completedAt: -1,
      }),
      Todo.find({ userId: req.user.id }).sort({ updatedAt: -1 }).limit(200),
    ]);

    const insights = await generateInsights(sessionHistory, taskHistory);

    return res.status(200).json({
      tips: insights.tips,
      summary: insights.summary,
      source: insights.source,
      generatedAt: new Date().toISOString(),
      rangeDays: days,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate AI insights", error: error.message });
  }
};

module.exports = {
  estimateTask,
  getSchedule,
  getNextTask,
  getSmartBreak,
  getInsights,
};
