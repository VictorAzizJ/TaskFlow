const mongoose = require("mongoose");

const pomodoroSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    todoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Todo",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["work", "shortBreak", "longBreak"],
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    plannedDuration: {
      type: Number,
      required: true,
      min: 1,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    interrupted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("PomodoroSession", pomodoroSessionSchema);
