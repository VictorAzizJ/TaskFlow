const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      set: (value) => {
        if (!Array.isArray(value)) {
          return [];
        }

        return value
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 20);
      },
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    estimatedPomodoros: {
      type: Number,
      min: 0,
      max: 20,
      default: null,
    },
    completedPomodoros: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Todo", todoSchema);
