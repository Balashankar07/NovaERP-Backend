import React from "react";
import { Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/use-permissions";

export interface DataTableToolbarProps {
  searchQuery?: string;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  onSearch?: (e?: React.FormEvent) => void;
  onClear?: () => void;
  searchPlaceholder?: string;
  hasSelections?: boolean;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onCancelSelection?: () => void;
  itemTypeName?: string;
  deletePermission?: string;
  actionSlot?: React.ReactNode;
}

export function DataTableToolbar({
  searchQuery,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onSearch,
  onClear,
  searchPlaceholder = "Search...",
  hasSelections = false,
  selectedCount = 0,
  onDeleteSelected,
  onCancelSelection,
  itemTypeName = "items",
  deletePermission,
  actionSlot
}: DataTableToolbarProps) {
  const { hasPermission } = usePermissions();
  const canDelete = deletePermission ? hasPermission(deletePermission) : true;
  const valueToDisplay = searchValue !== undefined ? searchValue : searchQuery || "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit(e);
    if (onSearch) onSearch(e);
  };

  return (
    <>
      {hasSelections && (
        <div className="absolute top-0 left-0 right-0 h-14 bg-indigo-50/95 backdrop-blur-sm border-b border-indigo-100 flex items-center justify-between px-4 z-10 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-600 hover:bg-indigo-600">{selectedCount}</Badge>
            <span className="text-sm font-medium text-indigo-900">{itemTypeName} selected</span>
          </div>
          <div className="flex items-center gap-2">
            {canDelete && onDeleteSelected && (
              <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50 h-8" onClick={onDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            )}
            {onCancelSelection && (
              <Button variant="ghost" size="sm" className="text-indigo-600 h-8" onClick={onCancelSelection}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-3 bg-muted/20">
        <form onSubmit={handleSubmit} className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={valueToDisplay}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
            className="pl-9 bg-card border-border focus-visible:ring-indigo-500/20"
          />
        </form>
        {actionSlot && <div className="flex items-center gap-2 w-full sm:w-auto justify-end">{actionSlot}</div>}
      </div>
    </>
  );
}
