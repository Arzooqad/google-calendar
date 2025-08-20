export type TaskCategory = "To Do" | "In Progress" | "Review" | "Completed";

export interface Task {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  category: TaskCategory;
}

export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface TaskFilter {
  categories: TaskCategory[];
  timeRange: number | null; // number of weeks
  searchQuery: string;
}
