const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Todo = require("../models/Todo");

const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2,
};

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

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return undefined;
  }

  return tags.map((tag) => String(tag).trim()).filter(Boolean);
};

const getSortSpec = (sortBy = "createdAt", order = "desc") => {
  const direction = order === "asc" ? 1 : -1;

  if (sortBy === "priority") {
    return null;
  }

  switch (sortBy) {
    case "dueDate":
      return { dueDate: direction, createdAt: -1 };
    case "updatedAt":
      return { updatedAt: direction };
    case "title":
      return { title: direction };
    case "createdAt":
    default:
      return { createdAt: direction };
  }
};

const getTodos = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const {
      status,
      priority,
      archived,
      search,
      tag,
      dueFrom,
      dueTo,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filters = { userId: req.user.id };
    const archivedValue = parseBoolean(archived);
    filters.archived = archivedValue === undefined ? false : archivedValue;

    if (status === "active") {
      filters.completed = false;
    } else if (status === "completed") {
      filters.completed = true;
    }

    if (["low", "medium", "high"].includes(priority)) {
      filters.priority = priority;
    }

    if (tag) {
      filters.tags = tag;
    }

    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (dueFrom || dueTo) {
      filters.dueDate = {};
      if (dueFrom) {
        const parsedFrom = new Date(dueFrom);
        if (!Number.isNaN(parsedFrom.getTime())) {
          filters.dueDate.$gte = parsedFrom;
        }
      }
      if (dueTo) {
        const parsedTo = new Date(dueTo);
        if (!Number.isNaN(parsedTo.getTime())) {
          filters.dueDate.$lte = parsedTo;
        }
      }

      if (Object.keys(filters.dueDate).length === 0) {
        delete filters.dueDate;
      }
    }

    const mongoSort = getSortSpec(sortBy, order);
    let todos;

    if (mongoSort) {
      todos = await Todo.find(filters).sort(mongoSort);
    } else {
      const baseTodos = await Todo.find(filters).sort({ createdAt: -1 });
      const priorityDirection = order === "asc" ? 1 : -1;
      todos = baseTodos.sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * priorityDirection
      );
    }

    return res.status(200).json({ todos });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch todos", error: error.message });
  }
};

const createTodo = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { title, description, priority, dueDate, tags, estimatedPomodoros } = req.body;

    const todo = await Todo.create({
      userId: req.user.id,
      title,
      description,
      priority,
      dueDate: dueDate || null,
      tags: normalizeTags(tags),
      estimatedPomodoros: estimatedPomodoros ?? null,
    });

    return res.status(201).json({ todo });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create todo", error: error.message });
  }
};

const updateTodo = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid todo id" });
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (todo.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatableFields = [
      "title",
      "description",
      "completed",
      "priority",
      "dueDate",
      "archived",
      "estimatedPomodoros",
      "completedPomodoros",
    ];

    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        todo[field] = req.body[field];
      }
    });

    if (Object.prototype.hasOwnProperty.call(req.body, "tags")) {
      todo.tags = normalizeTags(req.body.tags) || [];
    }

    await todo.save();
    return res.status(200).json({ todo });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update todo", error: error.message });
  }
};

const deleteTodo = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid todo id" });
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (todo.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await todo.deleteOne();
    return res.status(200).json({ message: "Todo deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete todo", error: error.message });
  }
};

const toggleTodo = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid todo id" });
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (todo.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    todo.completed = !todo.completed;
    await todo.save();

    return res.status(200).json({ todo });
  } catch (error) {
    return res.status(500).json({ message: "Failed to toggle todo", error: error.message });
  }
};

const archiveTodo = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid todo id" });
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (todo.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    todo.archived = true;
    await todo.save();

    return res.status(200).json({ todo });
  } catch (error) {
    return res.status(500).json({ message: "Failed to archive todo", error: error.message });
  }
};

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  archiveTodo,
};
