import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName = "this item",
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title || `Delete ${itemName}`}
      description={description || `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      isDestructive={true}
      isLoading={isLoading}
    />
  );
}

