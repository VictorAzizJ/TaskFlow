"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import type { Todo, TodoPriority } from "@/types";

export type TodoStatusFilter = "all" | "active" | "completed";
export type TodoSortField = "createdAt" | "updatedAt" | "dueDate" | "priority" | "title";
export type TodoSortOrder = "asc" | "desc";

export interface TodoFilters {
  status: TodoStatusFilter;
  sortBy: TodoSortField;
  order: TodoSortOrder;
}

export interface TodoInput {
  title: string;
  description?: string;
  priority?: TodoPriority;
  dueDate?: string | null;
  tags?: string[];
  estimatedPomodoros?: number | null;
}

interface TodosResponse {
  todos: Todo[];
}

interface TodoResponse {
  todo: Todo;
}

const initialFilters: TodoFilters = {
  status: "all",
  sortBy: "createdAt",
  order: "desc",
};

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filters, setFilters] = useState<TodoFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async (effectiveFilters: TodoFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<TodosResponse>("/todos", {
        params: {
          status: effectiveFilters.status,
          sortBy: effectiveFilters.sortBy,
          order: effectiveFilters.order,
          archived: false,
        },
      });
      setTodos(response.data.todos ?? []);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to load todos";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodos = useCallback(async (nextFilters?: Partial<TodoFilters>) => {
    if (nextFilters) {
      setFilters((current) => ({ ...current, ...nextFilters }));
      return;
    }

    await loadTodos(filters);
  }, [filters, loadTodos]);

  useEffect(() => {
    void loadTodos(filters);
  }, [filters, loadTodos]);

  const createTodo = useCallback(async (payload: TodoInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await api.post<TodoResponse>("/todos", payload);
      setTodos((current) => [response.data.todo, ...current]);
      return response.data.todo;
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to create todo";
      setError(message);
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateTodo = useCallback(async (id: string, payload: Partial<TodoInput>) => {
    setSaving(true);
    setError(null);

    const previousTodos = todos;
    setTodos((current) => current.map((todo) => (todo._id === id ? { ...todo, ...payload } : todo)));

    try {
      const response = await api.patch<TodoResponse>(`/todos/${id}`, payload);
      setTodos((current) =>
        current.map((todo) => (todo._id === id ? response.data.todo : todo))
      );
      return response.data.todo;
    } catch (requestError) {
      setTodos(previousTodos);
      const message =
        requestError instanceof Error ? requestError.message : "Failed to update todo";
      setError(message);
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, [todos]);

  const toggleTodo = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);

    const previousTodos = todos;
    setTodos((current) =>
      current.map((todo) => (todo._id === id ? { ...todo, completed: !todo.completed } : todo))
    );

    try {
      const response = await api.patch<TodoResponse>(`/todos/${id}/toggle`);
      setTodos((current) =>
        current.map((todo) => (todo._id === id ? response.data.todo : todo))
      );
      return response.data.todo;
    } catch (requestError) {
      setTodos(previousTodos);
      const message =
        requestError instanceof Error ? requestError.message : "Failed to toggle todo";
      setError(message);
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, [todos]);

  const deleteTodo = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);

    const previousTodos = todos;
    setTodos((current) => current.filter((todo) => todo._id !== id));

    try {
      await api.delete(`/todos/${id}`);
    } catch (requestError) {
      setTodos(previousTodos);
      const message =
        requestError instanceof Error ? requestError.message : "Failed to delete todo";
      setError(message);
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, [todos]);

  const archiveTodo = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/todos/${id}/archive`);
      setTodos((current) => current.filter((todo) => todo._id !== id));
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to archive todo";
      setError(message);
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const taskCounts = useMemo(() => {
    const completed = todos.filter((todo) => todo.completed).length;
    const active = todos.length - completed;

    return {
      all: todos.length,
      active,
      completed,
    };
  }, [todos]);

  return {
    todos,
    filters,
    loading,
    saving,
    error,
    taskCounts,
    fetchTodos,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    archiveTodo,
    setFilters,
  };
}
