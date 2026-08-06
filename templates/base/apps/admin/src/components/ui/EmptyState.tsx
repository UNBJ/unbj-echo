import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

/** Estado vacío centrado con icono, título, descripción opcional y acción. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle text-text-secondary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description && <p className="max-w-xs text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
