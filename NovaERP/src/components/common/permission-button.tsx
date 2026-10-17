import { Button, buttonVariants } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { type VariantProps } from "class-variance-authority";

export interface PermissionButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  permission: string;
  asChild?: boolean;
}

export function PermissionButton({ permission, children, ...props }: PermissionButtonProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return null;
  }

  return (
    <Button {...props}>
      {children}
    </Button>
  );
}
