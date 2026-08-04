import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: boolean
}

export function Card({ children, className, accent }: CardProps) {
  return (
    <div className={clsx('bg-bg-card border border-border rounded-xl shadow-sm', className)}>
      {accent && (
        <div className="h-[3px] bg-accent rounded-t-xl" />
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
