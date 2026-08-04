import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
        {label}
        {props.required && <span className="text-error ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={clsx(
          'border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors',
          error ? 'border-error focus:border-error' : 'border-border focus:border-accent',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
