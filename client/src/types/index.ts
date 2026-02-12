export interface User {
  _id: string;
  email: string;
  createdAt: string;
}

export type TodoPriority = "low" | "medium" | "high";

export interface Todo {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TodoPriority;
  dueDate?: string | null;
  tags: string[];
  archived: boolean;
  estimatedPomodoros?: number;
  completedPomodoros: number;
  createdAt: string;
  updatedAt: string;
}

export type PomodoroType = "work" | "shortBreak" | "longBreak";

export interface PomodoroSession {
  _id: string;
  userId: string;
  todoId?: string | null;
  type: PomodoroType;
  duration: number;
  plannedDuration: number;
  completedAt: string;
  interrupted: boolean;
  createdAt: string;
}
