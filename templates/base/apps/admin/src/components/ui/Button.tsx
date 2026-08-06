import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page',
        variant === 'primary' && 'bg-accent hover:bg-accent-hover text-white shadow-sm',
        variant === 'secondary' && 'bg-bg-card border border-border text-text-primary shadow-sm hover:bg-bg-subtle',
        variant === 'ghost' && 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary',
        className
      )}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
