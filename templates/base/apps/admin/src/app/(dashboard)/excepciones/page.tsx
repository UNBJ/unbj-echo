'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { listExceptions, createException, deleteException, type ChurchException } from '@/lib/api'
import { Trash2, Plus, Building2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ExcepcionesPage() {
  const { getToken } = useAuth()
  const [exceptions, setExceptions] = useState<ChurchException[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const token = await getToken()
      const { exceptions: list } = await listExceptions(token)
      setExceptions(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(churchId: string) {
    if (!confirm('¿Eliminar esta excepción?')) return
    try {
      const token = await getToken()
      await deleteException(token, churchId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-semibold tracking-tight text-text-primary">Excepciones de cupo</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Iglesias con cupo adicional de mensajeros acreditados (default: 5)
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nueva excepción
        </button>
      </div>

      {error && <p className="text-sm text-error mb-4">{error}</p>}

      {showForm && (
        <ExceptionForm
          onSave={async (data) => {
            const token = await getToken()
            await createException(token, data)
            setShowForm(false)
            await load()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-bg-card border border-border rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <p className="text-sm text-text-secondary text-center py-8">Cargando...</p>
        ) : exceptions.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No hay excepciones configuradas"
            description="Las iglesias con cupo adicional aparecerán aquí."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-subtle">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Iglesia</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Cupo extra</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Total</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Motivo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((ex) => (
                <tr key={ex.churchId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{ex.churchName}</p>
                    <p className="text-xs text-text-secondary">ID: {ex.churchId}</p>
                  </td>
                  <td className="px-4 py-3 text-text-primary">+{ex.extraQuota}</td>
                  <td className="px-4 py-3 font-semibold text-accent">{5 + ex.extraQuota}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs max-w-48 truncate">{ex.reason}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(ex.churchId)}
                      className="text-error hover:opacity-70 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ExceptionForm({
  onSave,
  onCancel,
}: {
  onSave: (data: { churchId: string; churchName: string; extraQuota: number; reason: string }) => Promise<void>
  onCancel: () => void
}) {
  const [churchId, setChurchId] = useState('')
  const [churchName, setChurchName] = useState('')
  const [extraQuota, setExtraQuota] = useState(1)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({ churchId, churchName, extraQuota, reason })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-xl shadow-card p-5 mb-4 flex flex-col gap-3 animate-fade-in">
      <h3 className="font-heading font-semibold text-text-primary text-sm">Nueva excepción</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">ID de iglesia</label>
          <input value={churchId} onChange={(e) => setChurchId(e.target.value)} required
            className="w-full border border-border rounded-lg bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150" />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Nombre de iglesia</label>
          <input value={churchName} onChange={(e) => setChurchName(e.target.value)} required
            className="w-full border border-border rounded-lg bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-text-secondary mb-1 block">Cupo extra (adicional a 5)</label>
        <input type="number" min={1} max={100} value={extraQuota} onChange={(e) => setExtraQuota(Number(e.target.value))} required
          className="w-32 border border-border rounded-lg bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150" />
      </div>
      <div>
        <label className="text-xs font-medium text-text-secondary mb-1 block">Motivo</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} required
          className="w-full border border-border rounded-lg bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150" />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-sm rounded-lg transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
