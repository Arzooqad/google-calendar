import { useDispatch, useSelector } from "react-redux";
import type { TaskCategory } from "../types";
import { updateFilters, selectFilters } from "../store/taskSlice";

const CATEGORIES: TaskCategory[] = [
  "To Do",
  "In Progress",
  "Review",
  "Completed",
];
const TIME_RANGES = [
  { label: "Within 1 week", value: 1 },
  { label: "Within 2 weeks", value: 2 },
  { label: "Within 3 weeks", value: 3 },
];

export function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);

  const toggleCategory = (category: TaskCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    dispatch(updateFilters({ categories: newCategories }));
  };

  return (
    <div className="flex flex-col gap-4 bg-white p-4 shadow sm:rounded-lg">
      <p className="font-semibold text-lg text-blue-900">Filters</p>
      <div>
        <h3 className="text-lg font-medium text-gray-900">Search Tasks</h3>
        <div className="mt-2">
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              dispatch(updateFilters({ searchQuery: e.target.value }))
            }
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search by task name..."
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Categories</h3>
        <div className="mt-2 space-y-2">
          {CATEGORIES.map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Time Range</h3>
        <p className="text-xs text-gray-700 mb-3" >{`(Upcoming weeks’ tasks.)`}</p>
        <div className="mt-2 space-y-2">
          {TIME_RANGES.map(({ label, value }) => (
            <label key={value} className="flex items-center">
              <input
                type="radio"
                checked={filters.timeRange === value}
                onChange={() => dispatch(updateFilters({ timeRange: value }))}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
          <label className="flex items-center">
            <input
              type="radio"
              checked={filters.timeRange === null}
              onChange={() => dispatch(updateFilters({ timeRange: null }))}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">All time</span>
          </label>
        </div>
      </div>
    </div>
  );
}
