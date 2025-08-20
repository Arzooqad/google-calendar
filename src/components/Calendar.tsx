import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Dispatch } from "redux";
import { toast } from "react-toastify";
import {
  DndContext,
  useDraggable,
  useDroppable,
  MouseSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  addDays,
  startOfDay,
  differenceInDays,
  isToday,
} from "date-fns";
import { getMonthDays, formatDate } from "../utils/dateUtils";
import { CalendarHeader } from "./CalendarHeader";
import { TaskModal } from "./TaskModal";
import type { Task, TaskFilter } from "../types";
import type { RootState } from "../store/store";
import {
  selectTasks,
  selectFilters,
  addTask,
  updateTask,
  deleteTask,
} from "../store/taskSlice";
import { LuPencil } from "react-icons/lu";
import { FaRegTrashCan } from "react-icons/fa6";

interface DragState {
  startDate: Date;
  endDate: Date;
}

interface DragData {
  date: Date;
  type: "cell" | "task" | "resize-left" | "resize-right";
  taskId?: string;
}

function filterTasks(tasks: Task[], filters: TaskFilter): Task[] {
  return tasks.filter((task) => {
    // Category filter
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(task.category)
    ) {
      return false;
    }

    // Time range filter
    if (filters.timeRange) {
      const today = startOfDay(new Date());
      const rangeEnd = addDays(today, filters.timeRange * 7);
      const taskStart = startOfDay(task.startDate);
      const taskEnd = startOfDay(task.endDate);

      if (
        !isWithinInterval(taskStart, { start: today, end: rangeEnd }) &&
        !isWithinInterval(taskEnd, { start: today, end: rangeEnd })
      ) {
        return false;
      }
    }

    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      return task.name.toLowerCase().includes(searchLower);
    }

    return true;
  });
}

function TaskItem({
  task,
  isOverlay = false,
  cellWidth,
  daysWidth,
  onEdit,
  onDelete,
  dispatch,
}: {
  task: Task;
  isOverlay?: boolean;
  cellWidth: number;
  daysWidth?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  dispatch?: Dispatch;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: task,
  });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<"left" | "right" | null>(null);
  const resizeStartPos = useRef<{ x: number; date: Date } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, edge: "left" | "right") => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeEdge(edge);
    const date = edge === "left" ? task.startDate : task.endDate;
    resizeStartPos.current = { x: e.clientX, date };

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartPos.current || !cellWidth) return;
      const deltaX = e.clientX - resizeStartPos.current.x;
      const daysDelta = Math.round(deltaX / cellWidth);
      const newDate = addDays(resizeStartPos.current.date, daysDelta);
      const updatedTask = { ...task };
      if (edge === "left") {
        if (newDate < task.endDate) updatedTask.startDate = newDate;
      } else {
        if (newDate > task.startDate) updatedTask.endDate = newDate;
      }
      dispatch?.(updateTask(updatedTask));
    };

    const handleMouseUp = () => {
      if (isResizing) toast.success("Task updated successfully");
      setIsResizing(false);
      setResizeEdge(null);
      resizeStartPos.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        width: isOverlay
          ? "200px"
          : daysWidth
          ? `calc(${daysWidth * 100}% + ${(daysWidth - 1) * 1}px)`
          : "100%",
        zIndex: isOverlay ? 999 : 10,
        position: "absolute",
        left: 0,
        right: 0,
        marginLeft: "-1px",
        pointerEvents: "auto",
      }
    : {
        width: daysWidth
          ? `calc(${daysWidth * 100}% + ${(daysWidth - 1) * 1}px)`
          : "100%",
        zIndex: 10,
        position: "absolute",
        left: 0,
        right: 0,
        marginLeft: "-1px",
        pointerEvents: "auto",
      };

  return (
    <div
      ref={setNodeRef}
      {...(isResizing ? {} : attributes)}
      {...(isResizing ? {} : listeners)}
      id={task.id}
      style={style as React.CSSProperties}
      className={`group absolute inset-x-0 top-0.5 min-w-[72px] h-[38px] cursor-move rounded-xl bg-blue-500 px-2 py-0.5 text-sm hover:bg-blue-600 text-white transition-colors task-item overflow-hidden ${
        isOverlay ? "opacity-50" : ""
      }`}
    >
      {/* Left resize handle */}
      <div
        className={`absolute left-0 top-0 h-full w-1 cursor-ew-resize bg-white/20 opacity-0 group-hover:opacity-100 ${
          resizeEdge === "left" ? "opacity-100" : ""
        }`}
        onMouseDown={(e) => handleResizeStart(e, "left")}
      />
      {/* LABEL and DATE */}
      <div className="flex flex-col items-start w-full h-full justify-center overflow-hidden">
        <span className="font-semibold text-xs w-full flex-none whitespace-nowrap overflow-ellipsis overflow-hidden">
          {task.name}
        </span>
        <span className="text-[10px] opacity-90 w-full flex-none whitespace-nowrap overflow-ellipsis overflow-hidden">
          {formatDate(task.startDate, "MMM d")}
          {task.endDate > task.startDate
            ? ` - ${formatDate(task.endDate, "MMM d")}`
            : ""}
        </span>
      </div>
      {/* Edit/Delete buttons only if not overlay */}
      {!isOverlay && (
        <div className="absolute right-2 top-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="p-1 rounded"
          >
            <LuPencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-1 rounded"
          >
            <FaRegTrashCan className="w-3 h-3" />
          </button>
        </div>
      )}
      {/* Right resize handle */}
      <div
        className={`absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-white/20 opacity-0 group-hover:opacity-100 ${
          resizeEdge === "right" ? "opacity-100" : ""
        }`}
        onMouseDown={(e) => handleResizeStart(e, "right")}
      />
    </div>
  );
}

function CalendarCell({
  date,
  tasks,
  isSelected,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  dispatch,
  cellWidth,
  onEditTask,
}: {
  date: Date;
  tasks: Task[];
  isSelected?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseUp?: () => void;
  dispatch: Dispatch;
  cellWidth: number;
  onEditTask: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: format(date, "yyyy-MM-dd"),
    data: {
      date,
      type: "cell",
    } as DragData,
  });

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      dispatch(deleteTask(taskId));
      toast.success("Task deleted successfully");
    }
  };

  return (
    <div
      ref={setNodeRef}
      data-date={format(date, "yyyy-MM-dd")}
      className={`relative h-32 border-b border-r p-1 transition-colors ${
        isSelected ? "bg-blue-50" : isOver ? "bg-blue-50/50" : "bg-white"
      } ${isToday(date) ? "bg-blue-50/20" : ""}`}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
    >
      <div
        className={`text-sm font-medium flex justify-center ${
          isToday(date)
            ? "text-white bg-blue-600 w-8 h-8 items-center justify-center rounded-full mx-auto"
            : "text-gray-700"
        }`}
      >
        {format(date, "d")}
      </div>
      <div className="relative mt-1">
        {tasks.map((task) => {
          const taskStartDate = startOfDay(task.startDate);
          const taskEndDate = startOfDay(task.endDate);
          const currentDate = startOfDay(date);

          // Check if this date is within the task's range
          if (
            !isWithinInterval(currentDate, {
              start: taskStartDate,
              end: taskEndDate,
            })
          ) {
            return null;
          }

          // First check if the date is within the task's duration
          if (
            !isWithinInterval(currentDate, {
              start: taskStartDate,
              end: taskEndDate,
            })
          ) {
            return null;
          }

          // Determine where to show the task
          const isTaskStart = isSameDay(currentDate, taskStartDate);
          const isWeekStart = currentDate.getDay() === 0;

          // Only show at start date or beginning of weeks
          if (!isTaskStart && !isWeekStart) {
            return null;
          }

          // Calculate total remaining duration from this point
          const remainingDuration =
            differenceInDays(taskEndDate, currentDate) + 1;

          // For any position (start or week start), calculate proper width
          const daysUntilWeekEnd = 7 - currentDate.getDay();
          const daysWidth = Math.min(daysUntilWeekEnd, remainingDuration);

          // Check if this task should be shown in this cell
          const shouldShowTask = isTaskStart || currentDate.getDay() === 0;
          if (!shouldShowTask) {
            return null;
          }

          return (
            <div
              key={task.id}
              className="relative h-8 mb-1"
              onClick={(e) => e.stopPropagation()}
            >
              <TaskItem
                task={task}
                cellWidth={cellWidth}
                daysWidth={daysWidth}
                onEdit={() => onEditTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
                dispatch={dispatch}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Calendar() {
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => selectTasks(state));
  const filters = useSelector((state: RootState) => selectFilters(state));
  const [currentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<DragState | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const calendarRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<Date | null>(null);
  const cellWidthRef = useRef<number>(0);

  const monthDays = getMonthDays(currentDate);
  const filteredTasks = useMemo(
    () => filterTasks(tasks, filters),
    [tasks, filters]
  );

  useEffect(() => {
    const updateCellWidth = () => {
      if (calendarRef.current) {
        const firstCell = calendarRef.current.querySelector("[data-date]");
        if (firstCell) {
          cellWidthRef.current = firstCell.getBoundingClientRect().width;
        }
      }
    };

    updateCellWidth();
    window.addEventListener("resize", updateCellWidth);
    return () => window.removeEventListener("resize", updateCellWidth);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current as Task;
    setDraggedTask(task);

    const element = document.getElementById(event.active.id.toString());
    if (element) {
      const rect = element.getBoundingClientRect();
      setDragPosition({ x: rect.left, y: rect.top });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || !event.active.data.current) return;

    // Only move if it's actually a drag
    if (
      event.delta &&
      (Math.abs(event.delta.x) > 2 || Math.abs(event.delta.y) > 2)
    ) {
      const task = event.active.data.current as Task;
      const targetData = event.over.data.current as DragData;

      if (targetData.type !== "cell") return;

      const targetDate = targetData.date;
      const duration = Math.floor(
        (task.endDate.getTime() - task.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const newStartDate = new Date(targetDate);
      const newEndDate = addDays(newStartDate, duration);

      dispatch(
        updateTask({
          ...task,
          startDate: newStartDate,
          endDate: newEndDate,
        })
      );
      toast.success("Task updated successfully");
    }

    setDraggedTask(null);
    setDragPosition(null);
  };

  const getDateFromPoint = useCallback((x: number, y: number): Date | null => {
    if (!calendarRef.current) return null;

    const element = document.elementFromPoint(x, y);
    const cell = element?.closest("[data-date]") as HTMLElement;
    if (!cell) return null;

    const dateStr = cell.dataset.date;
    if (!dateStr) return null;

    return parseISO(dateStr);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, date: Date) => {
    if (e.button !== 0) return; // Only handle left click

    // Don't create task if clicking on an existing task
    const target = e.target as HTMLElement;
    if (target.closest(".task-item")) return;

    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    startDateRef.current = date;
    setSelectedDates(new Set([format(date, "yyyy-MM-dd")]));
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !startDateRef.current) return;

      const currentDate = getDateFromPoint(e.clientX, e.clientY);
      if (!currentDate) return;

      const startDate = startDateRef.current;
      const newSelectedDates = new Set<string>();

      // Calculate the date range and add all dates in between
      const current = new Date(
        Math.min(startDate.getTime(), currentDate.getTime())
      );
      const end = new Date(
        Math.max(startDate.getTime(), currentDate.getTime())
      );

      while (current <= end) {
        newSelectedDates.add(format(current, "yyyy-MM-dd"));
        current.setDate(current.getDate() + 1);
      }

      setSelectedDates(newSelectedDates);
    },
    [isDragging, getDateFromPoint]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !startDateRef.current || selectedDates.size === 0)
      return;

    const dates = Array.from(selectedDates)
      .map((d) => parseISO(d))
      .sort((a, b) => a.getTime() - b.getTime());
    setModalData({
      startDate: dates[0],
      endDate: dates[dates.length - 1],
    });
    setIsModalOpen(true);

    setIsDragging(false);
    startDateRef.current = null;
    setSelectedDates(new Set());
  }, [isDragging, selectedDates]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mouseleave", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("mouseleave", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleEditTask = (task: Task) => {
    // Create a deep copy of the task with exact dates
    const editTask = {
      ...task,
      // Keep exact milliseconds to preserve time
      startDate: new Date(task.startDate.getTime()),
      endDate: new Date(task.endDate.getTime()),
    };

    // Store the exact same dates in modal data
    const modalDates = {
      startDate: new Date(task.startDate.getTime()),
      endDate: new Date(task.endDate.getTime()),
    };

    setEditingTask(editTask);
    setModalData(modalDates);
    setIsModalOpen(true);
  };

  const getTasksForDate = useCallback(
    (date: Date) => {
      const currentDate = startOfDay(date);
      return filteredTasks.filter((task) => {
        const taskStart = startOfDay(task.startDate);
        const taskEnd = startOfDay(task.endDate);

        // Check if the task spans this date
        return isWithinInterval(currentDate, {
          start: taskStart,
          end: taskEnd,
        });
      });
    },
    [filteredTasks]
  );

  const calculateTaskWidth = useCallback((task: Task, date: Date) => {
    const taskStart = startOfDay(task.startDate);
    const taskEnd = startOfDay(task.endDate);
    const currentDate = startOfDay(date);
    const dayOfWeek = currentDate.getDay();

    // Calculate days until end of week
    const daysUntilWeekEnd = 7 - dayOfWeek;

    // Calculate remaining task duration from current date
    const remainingDuration = differenceInDays(taskEnd, currentDate) + 1;

    // If this is the start of the task, show full width until week end
    if (isSameDay(currentDate, taskStart)) {
      return Math.min(daysUntilWeekEnd, remainingDuration);
    }

    // If this is the start of a week (Sunday), show remaining duration
    if (dayOfWeek === 0) {
      return Math.min(7, remainingDuration);
    }

    return 0; // Don't show the task in other cells
  }, []);

  return (
    <div
      className="h-full overflow-hidden rounded-lg bg-white shadow"
      onMouseLeave={handleMouseUp}
    >
      <div className="flex h-full flex-col" ref={calendarRef}>
        <div className="flex-none">
          <CalendarHeader />
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
        >
          <div className="flex-1 grid grid-cols-7">
            {monthDays.map((day) => {
              const dateStr = format(day.date, "yyyy-MM-dd");
              const tasksForDate = getTasksForDate(day.date);

              return (
                <CalendarCell
                  key={dateStr}
                  date={day.date}
                  tasks={tasksForDate.map((task) => ({
                    ...task,
                    daysWidth: calculateTaskWidth(task, day.date),
                  }))}
                  isSelected={selectedDates.has(dateStr)}
                  onMouseDown={(e) => handleMouseDown(e, day.date)}
                  dispatch={dispatch}
                  cellWidth={cellWidthRef.current}
                  onEditTask={handleEditTask}
                />
              );
            })}
          </div>

          {draggedTask && dragPosition && (
            <div
              style={{
                position: "fixed",
                pointerEvents: "none",
                zIndex: 100,
                left: dragPosition.x,
                top: dragPosition.y,
                opacity: 0.5,
                transform: "rotate(3deg)",
              }}
            >
              <TaskItem
                task={draggedTask}
                isOverlay
                cellWidth={cellWidthRef.current}
                dispatch={dispatch}
              />
            </div>
          )}
        </DndContext>

        {modalData && (
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setModalData(null);
              setEditingTask(null);
            }}
            onSave={(taskData) => {
              if (editingTask) {
                // Create a new task object with the original dates
                const updatedTask = {
                  ...editingTask,
                  name: taskData.name || editingTask.name,
                  category: taskData.category || editingTask.category,
                };

                // Only update dates if they are explicitly different
                const newStartDate = new Date(taskData.startDate.getTime());
                const newEndDate = new Date(taskData.endDate.getTime());

                if (!isSameDay(newStartDate, editingTask.startDate)) {
                  updatedTask.startDate = newStartDate;
                }
                if (!isSameDay(newEndDate, editingTask.endDate)) {
                  updatedTask.endDate = newEndDate;
                }

                dispatch(updateTask(updatedTask));
                toast.success("Task updated successfully");
              } else {
                // For new tasks, preserve exact dates
                const newTask = {
                  ...taskData,
                  startDate: new Date(taskData.startDate.getTime()),
                  endDate: new Date(taskData.endDate.getTime()),
                };
                dispatch(addTask(newTask));
                toast.success("Task created successfully");
              }
              setIsModalOpen(false);
              setModalData(null);
              setEditingTask(null);
            }}
            initialData={{
              ...modalData,
              name: editingTask?.name,
              category: editingTask?.category,
            }}
          />
        )}
      </div>
    </div>
  );
}
