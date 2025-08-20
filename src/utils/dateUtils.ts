import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  addWeeks,
  isWithinInterval,
} from "date-fns";
import type { DayCell, Task } from "../types";

export function getMonthDays(date: Date): DayCell[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(
    (date) => ({
      date,
      isCurrentMonth: isSameMonth(date, monthStart),
      isToday: isToday(date),
    })
  );
}

export function formatDate(date: Date, formatStr: string = "MMM d"): string {
  return format(date, formatStr);
}

export function isTaskWithinTimeRange(task: Task, weeks: number): boolean {
  const today = new Date();
  const rangeEnd = addWeeks(today, weeks);

  return (
    isWithinInterval(task.startDate, { start: today, end: rangeEnd }) ||
    isWithinInterval(task.endDate, { start: today, end: rangeEnd })
  );
}

export function getDaysBetweenDates(startDate: Date, endDate: Date): number {
  return eachDayOfInterval({ start: startDate, end: endDate }).length;
}
