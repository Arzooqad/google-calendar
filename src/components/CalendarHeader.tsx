import { format, addDays, startOfWeek } from "date-fns";

export function CalendarHeader() {
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "EEE")
  );

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {weekDays.map((day) => (
        <div
          key={day}
          className="bg-gray-200 py-2 text-center text-sm font-semibold text-gray-900"
        >
          {day}
        </div>
      ))}
    </div>
  );
}
