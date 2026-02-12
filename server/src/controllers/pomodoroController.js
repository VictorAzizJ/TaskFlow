const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const PomodoroSession = require("../models/PomodoroSession");
const Todo = require("../models/Todo");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

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

const parseBoolean = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  return undefined;
};

const getDateRange = (from, to) => {
  if (!from && !to) {
    return null;
  }

  const range = {};

  if (from) {
    const startDate = new Date(from);
    if (!Number.isNaN(startDate.getTime())) {
      range.$gte = startDate;
    }
  }

  if (to) {
    const endDate = new Date(to);
    if (!Number.isNaN(endDate.getTime())) {
      range.$lte = endDate;
    }
  }

  return Object.keys(range).length ? range : null;
};

const createSession = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { todoId, type, duration, plannedDuration, completedAt, interrupted = false } = req.body;
    let linkedTodo = null;

    if (todoId) {
      if (!isValidObjectId(todoId)) {
        return res.status(400).json({ message: "Invalid todo id" });
      }

      linkedTodo = await Todo.findById(todoId);
      if (!linkedTodo) {
        return res.status(404).json({ message: "Todo not found" });
      }

      if (linkedTodo.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const session = await PomodoroSession.create({
      userId: req.user.id,
      todoId: todoId || null,
      type,
      duration,
      plannedDuration,
      completedAt: completedAt || undefined,
      interrupted,
    });

    if (linkedTodo && type === "work" && !interrupted) {
      linkedTodo.completedPomodoros += 1;
      await linkedTodo.save();
    }

    return res.status(201).json({ session });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create pomodoro session", error: error.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { todoId, type, interrupted, from, to, limit = 50, page = 1 } = req.query;
    const filters = { userId: req.user.id };

    if (todoId) {
      filters.todoId = todoId;
    }

    if (type) {
      filters.type = type;
    }

    const interruptedFilter = parseBoolean(interrupted);
    if (interruptedFilter !== undefined) {
      filters.interrupted = interruptedFilter;
    }

    const dateRange = getDateRange(from, to);
    if (dateRange) {
      filters.completedAt = dateRange;
    }

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const skip = (pageNumber - 1) * pageSize;

    const [sessions, total] = await Promise.all([
      PomodoroSession.find(filters)
        .sort({ completedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      PomodoroSession.countDocuments(filters),
    ]);

    return res.status(200).json({
      sessions,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch sessions", error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { from, to, todoId } = req.query;
    const match = {
      userId: new mongoose.Types.ObjectId(req.user.id),
    };

    if (todoId) {
      match.todoId = new mongoose.Types.ObjectId(todoId);
    }

    const dateRange = getDateRange(from, to);
    if (dateRange) {
      match.completedAt = dateRange;
    }

    const [totals, byType] = await Promise.all([
      PomodoroSession.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            completedSessions: {
              $sum: {
                $cond: [{ $eq: ["$interrupted", false] }, 1, 0],
              },
            },
            interruptedSessions: {
              $sum: {
                $cond: [{ $eq: ["$interrupted", true] }, 1, 0],
              },
            },
            totalFocusSeconds: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$type", "work"] },
                      { $eq: ["$interrupted", false] },
                    ],
                  },
                  "$duration",
                  0,
                ],
              },
            },
            totalBreakSeconds: {
              $sum: {
                $cond: [
                  { $in: ["$type", ["shortBreak", "longBreak"]] },
                  "$duration",
                  0,
                ],
              },
            },
          },
        },
      ]),
      PomodoroSession.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalDuration: { $sum: "$duration" },
          },
        },
      ]),
    ]);

    const aggregate = totals[0] || {
      totalSessions: 0,
      completedSessions: 0,
      interruptedSessions: 0,
      totalFocusSeconds: 0,
      totalBreakSeconds: 0,
    };

    const completionRate =
      aggregate.totalSessions > 0
        ? Number(((aggregate.completedSessions / aggregate.totalSessions) * 100).toFixed(2))
        : 0;

    return res.status(200).json({
      stats: {
        ...aggregate,
        completionRate,
        byType,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
};

const getPatterns = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { from, to } = req.query;
    const match = {
      userId: new mongoose.Types.ObjectId(req.user.id),
      type: "work",
    };

    const dateRange = getDateRange(from, to);
    if (dateRange) {
      match.completedAt = dateRange;
    }

    const hourly = await PomodoroSession.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $hour: "$completedAt" },
          sessions: { $sum: 1 },
          completedSessions: {
            $sum: {
              $cond: [{ $eq: ["$interrupted", false] }, 1, 0],
            },
          },
          interruptedSessions: {
            $sum: {
              $cond: [{ $eq: ["$interrupted", true] }, 1, 0],
            },
          },
          focusSeconds: {
            $sum: {
              $cond: [{ $eq: ["$interrupted", false] }, "$duration", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          hour: "$_id",
          sessions: 1,
          completedSessions: 1,
          interruptedSessions: 1,
          focusSeconds: 1,
          interruptionRate: {
            $cond: [
              { $eq: ["$sessions", 0] },
              0,
              {
                $multiply: [{ $divide: ["$interruptedSessions", "$sessions"] }, 100],
              },
            ],
          },
        },
      },
      { $sort: { hour: 1 } },
    ]);

    return res.status(200).json({ patterns: hourly });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patterns", error: error.message });
  }
};

module.exports = {
  createSession,
  getSessions,
  getStats,
  getPatterns,
};
