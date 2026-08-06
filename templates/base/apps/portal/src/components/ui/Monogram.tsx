import { branding } from '@unbj/shared'
import clsx from 'clsx'

interface MonogramProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-xs rounded-lg',
  md: 'h-10 w-10 text-sm rounded-xl',
  lg: 'h-14 w-14 text-lg rounded-xl',
}

/** Monograma por defecto: iniciales del evento sobre fondo de acento. */
export function Monogram({ size = 'md', className }: MonogramProps) {
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-flex shrink-0 select-none items-center justify-center bg-accent font-heading font-semibold tracking-tight text-white shadow-sm',
        sizes[size],
        className
      )}
    >
      {branding.logoInitials}
    </span>
  )
}
