import * as React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function PageContainer({ className, children, ...props }: PageContainerProps) {
  return (
    <div
      className={cn("flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10 page-enter", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  subtitle?: string
  breadcrumbs?: React.ReactNode
  actions?: React.ReactNode
  badge?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ 
  title, 
  description,
  subtitle, 
  breadcrumbs, 
  actions, 
  badge,
  children,
  className,
  ...props 
}: PageHeaderProps) {
  const displayDescription = subtitle || description;
  const headerActions = actions || children;
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-border/40", className)} {...props}>
      <div className="flex flex-col gap-1.5 min-w-0">
        {breadcrumbs && <div className="mb-1 text-[11px] font-medium text-muted-foreground/70 flex items-center gap-1.5">{breadcrumbs}</div>}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
          {badge}
        </div>
        {displayDescription && <p className="text-[13px] text-muted-foreground/80 max-w-3xl leading-relaxed mt-0.5">{displayDescription}</p>}
      </div>
      {headerActions && (
        <div className="flex items-center gap-2.5 mt-2 md:mt-0 shrink-0 flex-wrap">
          {headerActions}
        </div>
      )}
    </div>
  )
}

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function SectionCard({ title, description, action, children, className, ...props }: SectionCardProps) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card text-card-foreground shadow-[var(--shadow-elevation-1)] overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-elevation-2)] hover:border-border/80", className)} {...props}>
      {(title || description || action) && (
        <div className="flex items-center justify-between p-5 pb-4 border-b border-border/40 bg-muted/15">
          <div className="flex flex-col space-y-1">
            {title && <h3 className="font-semibold text-sm leading-none tracking-tight text-foreground">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
