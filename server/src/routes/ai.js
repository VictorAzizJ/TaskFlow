const express = require("express");
const { body, query } = require("express-validator");
const auth = require("../middleware/auth");
const {
  estimateTask,
  getSchedule,
  getNextTask,
  getSmartBreak,
  getInsights,
} = require("../controllers/aiController");

const router = express.Router();

const estimateValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is required")
    .isLength({ max: 200 })
    .withMessage("title must be 200 characters or fewer"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("description must be a string")
    .isLength({ max: 2000 })
    .withMessage("description must be 2000 characters or fewer"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("priority must be low, medium, or high"),
];

const scheduleValidation = [
  query("workDuration")
    .optional()
    .isInt({ min: 60, max: 60 * 60 * 3 })
    .withMessage("workDuration must be between 60 and 10800"),
  query("shortBreakDuration")
    .optional()
    .isInt({ min: 60, max: 60 * 60 })
    .withMessage("shortBreakDuration must be between 60 and 3600"),
  query("longBreakDuration")
    .optional()
    .isInt({ min: 60, max: 60 * 60 * 2 })
    .withMessage("longBreakDuration must be between 60 and 7200"),
  query("longBreakEvery")
    .optional()
    .isInt({ min: 2, max: 8 })
    .withMessage("longBreakEvery must be between 2 and 8"),
];

const smartBreakValidation = [
  query("currentSessionCount")
    .optional()
    .isInt({ min: 0, max: 200 })
    .withMessage("currentSessionCount must be 0 or higher"),
  query("hour")
    .optional()
    .isInt({ min: 0, max: 23 })
    .withMessage("hour must be between 0 and 23"),
  query("shortBreakDuration")
    .optional()
    .isInt({ min: 60, max: 60 * 60 })
    .withMessage("shortBreakDuration must be between 60 and 3600"),
  query("longBreakDuration")
    .optional()
    .isInt({ min: 60, max: 60 * 60 * 2 })
    .withMessage("longBreakDuration must be between 60 and 7200"),
  query("longBreakEvery")
    .optional()
    .isInt({ min: 2, max: 8 })
    .withMessage("longBreakEvery must be between 2 and 8"),
];

const insightsValidation = [
  query("days")
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage("days must be between 1 and 60"),
];

router.use(auth);

router.post("/estimate", estimateValidation, estimateTask);
router.get("/schedule", scheduleValidation, getSchedule);
router.get("/next-task", getNextTask);
router.get("/smart-break", smartBreakValidation, getSmartBreak);
router.get("/insights", insightsValidation, getInsights);

module.exports = router;
