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
        <div className="h-[3px] bg-gradient-to-r from-[#C8A44A]/60 via-[#E8D088]/80 to-[#C8A44A]/60 rounded-t-xl" />
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
