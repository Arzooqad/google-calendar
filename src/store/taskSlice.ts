import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Task, TaskFilter, TaskCategory } from "../types";
import type { RootState } from "./store";

const STORAGE_KEY = "calendar_tasks";

// Load initial state from localStorage
const loadInitialState = (): Task[] => {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks);
      // Convert date strings back to Date objects
      return tasks.map(
        (task: {
          id: string;
          name: string;
          startDate: string;
          endDate: string;
          category: TaskCategory;
        }) => ({
          ...task,
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate),
        })
      );
    }
  } catch (error) {
    console.error("Error loading tasks from localStorage:", error);
  }
  return [];
};

interface TaskState {
  tasks: Task[];
  filters: TaskFilter;
}

const initialState: TaskState = {
  tasks: loadInitialState(),
  filters: {
    categories: [],
    timeRange: null,
    searchQuery: "",
  },
};

// Helper function to save tasks to localStorage
const saveTasksToStorage = (tasks: Task[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error);
  }
};

export const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<Omit<Task, "id">>) => {
      const newTask: Task = {
        ...action.payload,
        id: crypto.randomUUID(),
      };
      state.tasks.push(newTask);
      saveTasksToStorage(state.tasks);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(
        (task) => task.id === action.payload.id
      );
      if (index !== -1) {
        state.tasks[index] = action.payload;
        saveTasksToStorage(state.tasks);
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      saveTasksToStorage(state.tasks);
    },
    updateFilters: (state, action: PayloadAction<Partial<TaskFilter>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { addTask, updateTask, deleteTask, updateFilters } =
  taskSlice.actions;

// Selectors
export const selectTasks = (state: RootState) => state.tasks.tasks;
export const selectFilters = (state: RootState) => state.tasks.filters;

export default taskSlice.reducer;
