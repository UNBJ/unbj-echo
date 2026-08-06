'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

interface MotionProps {
  children: ReactNode
  className?: string
  delay?: number
}

/** Entrada suave (fade + desplazamiento vertical). Respeta prefers-reduced-motion. */
export function FadeIn({ children, className, delay = 0 }: MotionProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Contenedor que escalona la entrada de sus StaggerItem hijos. */
export function Stagger({ children, className }: MotionProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : 'hidden'}
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: MotionProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
