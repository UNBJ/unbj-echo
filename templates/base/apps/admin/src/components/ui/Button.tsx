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
        'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-[#1A1A2E] hover:bg-[#2d2d50] text-white',
        variant === 'secondary' && 'bg-white border border-border text-text-primary hover:bg-gray-50',
        variant === 'ghost' && 'text-text-secondary hover:text-text-primary',
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
