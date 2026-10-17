import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  field: string;
  label: string;
  currentSortBy?: string;
  currentSortOrder?: string;
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({
  field,
  label,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
}: SortableHeaderProps) {
  const isSorted = currentSortBy === field;
  const isAsc = currentSortOrder === "asc";

  return (
    <th
      className={cn(
        "px-6 py-4 cursor-pointer hover:bg-slate-100 select-none transition-colors",
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {!isSorted && <span className="opacity-20 text-xs">↕</span>}
        {isSorted && isAsc && <span className="text-indigo-500 text-xs">↑</span>}
        {isSorted && !isAsc && <span className="text-indigo-500 text-xs">↓</span>}
      </div>
    </th>
  );
}
