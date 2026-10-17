
import { Button } from "./button";
import { PaginatedResponse } from "@/types/api.types";

interface PaginationProps {
  data: PaginatedResponse<any>;
  onPageChange: (newPage: number) => void;
}

export function Pagination({ data, onPageChange }: PaginationProps) {
  if (data.totalPages <= 1) return null;

  return (
    <div className="border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 mt-auto">
      <span className="text-sm text-slate-500 text-center sm:text-left">
        Showing <span className="font-medium text-slate-900">{(data.pageNumber - 1) * data.pageSize + 1}</span> to <span className="font-medium text-slate-900">{Math.min(data.pageNumber * data.pageSize, data.totalCount)}</span> of <span className="font-medium text-slate-900">{data.totalCount}</span> records
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(data.pageNumber - 1)}
          disabled={data.pageNumber <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(data.pageNumber + 1)}
          disabled={data.pageNumber >= data.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
