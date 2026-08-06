'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getStats, type StatsResponse } from '@/lib/api'
import { STATUS_LABELS, STATUS_COLORS, DELEGATE_LABELS } from '@/lib/labels'
import type { RegistrationStatus, DelegateType } from '@unbj/shared'
import { RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { FadeIn } from '@/components/ui/motion'

export default function StatsPage() {
  const { getToken } = useAuth()
  const [data, setData] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      setData(await getStats(token))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-heading font-semibold tracking-tight text-text-primary">Estadísticas</h1>
        <button onClick={load} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {data && (
        <FadeIn className="flex flex-col gap-6">
          {/* Totales principales */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total de registros" value={data.total} color="accent" />
            <StatCard
              label="Mensajeros Acreditados"
              value={data.byDelegate['mensajero_acreditado'] ?? 0}
              color="indigo"
            />
            <StatCard
              label="Fraternales"
              value={data.byDelegate['fraternal'] ?? 0}
              color="gray"
            />
          </div>

          {/* Por estado */}
          <div className="bg-bg-card border border-border rounded-xl shadow-card p-5">
            <h2 className="text-sm font-heading font-semibold text-text-primary mb-4">Por estado</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-subtle">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[status as RegistrationStatus])}>
                    {STATUS_LABELS[status as RegistrationStatus] ?? status}
                  </span>
                  <span className="text-sm font-semibold text-text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top iglesias */}
          {data.topChurches.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl shadow-card p-5">
              <h2 className="text-sm font-heading font-semibold text-text-primary mb-4">Top iglesias con más registros</h2>
              <div className="flex flex-col gap-2">
                {data.topChurches.map((church, i) => {
                  const pct = Math.round((church.count / data.total) * 100)
                  return (
                    <div key={church.name} className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-text-primary">{church.name}</span>
                          <span className="text-sm font-semibold text-text-primary">{church.count}</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Por convención */}
          {Object.keys(data.byConvention).length > 1 && (
            <div className="bg-bg-card border border-border rounded-xl shadow-card p-5">
              <h2 className="text-sm font-heading font-semibold text-text-primary mb-4">Por convención</h2>
              <div className="flex flex-col gap-2">
                {Object.entries(data.byConvention).map(([conv, count]) => (
                  <div key={conv} className="flex justify-between items-center px-3 py-2 bg-bg-subtle rounded-lg">
                    <span className="text-sm text-text-primary">{conv}</span>
                    <span className="text-sm font-semibold text-text-primary">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </FadeIn>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'accent' | 'indigo' | 'gray' }) {
  const colorMap = {
    accent: 'text-accent',
    indigo: 'text-text-primary',
    gray: 'text-text-secondary',
  }
  return (
    <div className="bg-bg-card border border-border rounded-xl shadow-card p-5">
      <p className={clsx('text-3xl font-semibold tracking-tight mb-1', colorMap[color])}>{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  )
}
