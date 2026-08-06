'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import clsx from 'clsx'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={clsx(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-card text-text-secondary transition-all duration-150 hover:bg-bg-subtle hover:text-text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        className
      )}
    >
      {mounted && resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}
