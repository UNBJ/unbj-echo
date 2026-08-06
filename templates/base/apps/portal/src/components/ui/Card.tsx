import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: boolean
}

export function Card({ children, className, accent }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-bg-card border rounded-xl shadow-card',
        accent ? 'border-accent/40' : 'border-border',
        className
      )}
    >
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
