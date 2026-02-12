const express = require("express");
const { body, query } = require("express-validator");
const auth = require("../middleware/auth");
const {
  createSession,
  getSessions,
  getStats,
  getPatterns,
} = require("../controllers/pomodoroController");

const router = express.Router();

const dateRangeValidation = [
  query("from").optional().isISO8601().withMessage("from must be a valid date"),
  query("to").optional().isISO8601().withMessage("to must be a valid date"),
];

const createSessionValidation = [
  body("todoId").optional({ nullable: true }).isMongoId().withMessage("todoId must be valid"),
  body("type")
    .isIn(["work", "shortBreak", "longBreak"])
    .withMessage("type must be work, shortBreak, or longBreak"),
  body("duration")
    .isInt({ min: 1, max: 60 * 60 * 4 })
    .withMessage("duration must be between 1 and 14400 seconds"),
  body("plannedDuration")
    .isInt({ min: 1, max: 60 * 60 * 4 })
    .withMessage("plannedDuration must be between 1 and 14400 seconds"),
  body("completedAt").optional().isISO8601().withMessage("completedAt must be a valid date"),
  body("interrupted").optional().isBoolean().withMessage("interrupted must be a boolean"),
];

const getSessionsValidation = [
  query("todoId").optional().isMongoId().withMessage("todoId must be valid"),
  query("type")
    .optional()
    .isIn(["work", "shortBreak", "longBreak"])
    .withMessage("type must be work, shortBreak, or longBreak"),
  query("interrupted")
    .optional()
    .isIn(["true", "false"])
    .withMessage("interrupted must be true or false"),
  query("limit").optional().isInt({ min: 1, max: 200 }).withMessage("limit must be 1-200"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be 1 or higher"),
  ...dateRangeValidation,
];

const statsValidation = [
  query("todoId").optional().isMongoId().withMessage("todoId must be valid"),
  ...dateRangeValidation,
];

router.use(auth);

router.post("/sessions", createSessionValidation, createSession);
router.get("/sessions", getSessionsValidation, getSessions);
router.get("/stats", statsValidation, getStats);
router.get("/patterns", dateRangeValidation, getPatterns);

module.exports = router;
