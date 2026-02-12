const express = require("express");
const { body, param, query } = require("express-validator");
const auth = require("../middleware/auth");
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  archiveTodo,
} = require("../controllers/todoController");

const router = express.Router();

const objectIdParamValidation = param("id").isMongoId().withMessage("Valid todo id is required");

const priorityValidation = body("priority")
  .optional()
  .isIn(["low", "medium", "high"])
  .withMessage("Priority must be low, medium, or high");

const estimatedPomodorosValidation = body("estimatedPomodoros")
  .optional({ nullable: true })
  .isInt({ min: 0, max: 20 })
  .withMessage("Estimated pomodoros must be between 0 and 20");

const completedPomodorosValidation = body("completedPomodoros")
  .optional()
  .isInt({ min: 0 })
  .withMessage("Completed pomodoros must be 0 or more");

const createTodoValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title must be 200 characters or fewer"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 2000 })
    .withMessage("Description must be 2000 characters or fewer"),
  priorityValidation,
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Due date must be valid"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .isString()
    .withMessage("Each tag must be a string")
    .isLength({ max: 50 })
    .withMessage("Tag must be 50 characters or fewer"),
  estimatedPomodorosValidation,
];

const updateTodoValidation = [
  objectIdParamValidation,
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Title must be 200 characters or fewer"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 2000 })
    .withMessage("Description must be 2000 characters or fewer"),
  body("completed").optional().isBoolean().withMessage("Completed must be a boolean"),
  priorityValidation,
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Due date must be valid"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .isString()
    .withMessage("Each tag must be a string")
    .isLength({ max: 50 })
    .withMessage("Tag must be 50 characters or fewer"),
  body("archived").optional().isBoolean().withMessage("Archived must be a boolean"),
  estimatedPomodorosValidation,
  completedPomodorosValidation,
];

const getTodosValidation = [
  query("status")
    .optional()
    .isIn(["all", "active", "completed"])
    .withMessage("Status must be all, active, or completed"),
  query("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
  query("archived").optional().isBoolean().withMessage("Archived must be true or false"),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "dueDate", "priority", "title"])
    .withMessage("Unsupported sortBy value"),
  query("order").optional().isIn(["asc", "desc"]).withMessage("Order must be asc or desc"),
  query("dueFrom").optional().isISO8601().withMessage("dueFrom must be a valid date"),
  query("dueTo").optional().isISO8601().withMessage("dueTo must be a valid date"),
];

router.use(auth);

router.get("/", getTodosValidation, getTodos);
router.post("/", createTodoValidation, createTodo);
router.patch("/:id", updateTodoValidation, updateTodo);
router.patch("/:id/toggle", [objectIdParamValidation], toggleTodo);
router.patch("/:id/archive", [objectIdParamValidation], archiveTodo);
router.delete("/:id", [objectIdParamValidation], deleteTodo);

module.exports = router;
