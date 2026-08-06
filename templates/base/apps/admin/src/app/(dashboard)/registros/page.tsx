'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { listRegistrations, type ListRegistrationsResponse } from '@/lib/api'
import { STATUS_LABELS, STATUS_COLORS, DELEGATE_LABELS } from '@/lib/labels'
import type { RegistrationStatus, DelegateType } from '@unbj/shared'
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending_payment', label: 'Pendiente de pago' },
  { value: 'payment_submitted', label: 'Pago en proceso' },
  { value: 'payment_approved', label: 'Pago aprobado' },
  { value: 'payment_rejected', label: 'Pago rechazado' },
  { value: 'carta_pending', label: 'Carta pendiente' },
  { value: 'carta_submitted', label: 'Carta enviada' },
  { value: 'fully_approved', label: 'Aprobado' },
  { value: 'checked_in', label: 'Check-in' },
]

const DELEGATE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'mensajero_acreditado', label: 'Mensajero' },
  { value: 'fraternal', label: 'Fraternal' },
]

export default function RegistrosPage() {
  const { getToken } = useAuth()
  const [data, setData] = useState<ListRegistrationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState('')
  const [delegateType, setDelegateType] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [cursorHistory, setCursorHistory] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const result = await listRegistrations(token, { status, delegateType, search, cursor })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar registros')
    } finally {
      setLoading(false)
    }
  }, [getToken, status, delegateType, search, cursor])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setCursor(undefined)
    setCursorHistory([])
  }

  function handleStatusChange(val: string) {
    setStatus(val)
    setCursor(undefined)
    setCursorHistory([])
  }

  function handleDelegateChange(val: string) {
    setDelegateType(val)
    setCursor(undefined)
    setCursorHistory([])
  }

  const page = cursorHistory.length + 1

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-semibold tracking-tight text-text-primary">Registros</h1>
          {data && (
            <p className="text-sm text-text-secondary mt-0.5">{data.total} registros en total</p>
          )}
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-bg-card border border-border rounded-xl shadow-card p-4 mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Nombre, correo o iglesia..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            Buscar
          </button>
        </form>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg-card"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={delegateType}
          onChange={(e) => handleDelegateChange(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg-card"
        >
          {DELEGATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-bg-card border border-border rounded-xl shadow-card overflow-hidden">
        {error && (
          <div className="p-4 text-sm text-error text-center">{error}</div>
        )}

        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-subtle">
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Iglesia</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Registro</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && !data && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                      Cargando...
                    </td>
                  </tr>
                )}
                {(data?.registrations ?? []).map((reg) => (
                  <tr key={reg.id} className="border-b border-border last:border-0 hover:bg-bg-subtle transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{reg.fullName}</p>
                      <p className="text-xs text-text-secondary">{reg.email}</p>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{reg.churchName}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        reg.delegateType === 'mensajero_acreditado'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-bg-subtle text-text-secondary'
                      )}>
                        {reg.delegateType ? DELEGATE_LABELS[reg.delegateType] : 'Sin asignar'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        STATUS_COLORS[reg.status as RegistrationStatus]
                      )}>
                        {STATUS_LABELS[reg.status as RegistrationStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {new Date(reg.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/registros/${reg.id}`}
                        className="text-accent hover:text-accent-hover font-medium text-xs"
                      >
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
                {data && data.registrations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                      No se encontraron registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {data && (cursorHistory.length > 0 || data.nextCursor) && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-text-secondary">
              Página {page}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const history = [...cursorHistory]
                  const previousCursor = history.pop()
                  setCursorHistory(history)
                  setCursor(previousCursor || undefined)
                }}
                disabled={cursorHistory.length === 0}
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-subtle transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (!data.nextCursor) return
                  setCursorHistory((history) => [...history, cursor ?? ''])
                  setCursor(data.nextCursor)
                }}
                disabled={!data.nextCursor}
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-subtle transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
