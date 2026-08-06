import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('bg-bg-card border border-border rounded-xl shadow-card', className)}>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
