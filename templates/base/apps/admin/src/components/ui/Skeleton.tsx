import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

/** Bloque de carga esqueleto; combinar varios para componer layouts de loading. */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden className={clsx('animate-pulse rounded-md bg-bg-subtle', className)} />
}
