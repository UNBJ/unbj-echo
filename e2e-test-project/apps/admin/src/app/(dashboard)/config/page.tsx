'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { getConfig, updateConfig, type GlobalConfig } from '@/lib/api'
import { Save, Download } from 'lucide-react'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export default function ConfigPage() {
  const { getToken } = useAuth()
  const [config, setConfig] = useState<GlobalConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getToken().then((t) => getConfig(t)).then((c) => { setConfig(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const token = await getToken()
      await updateConfig(token, config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    const token = await getToken()
    const url = `${API_URL}/admin/export`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'registros-plenarias-2026.csv'
    a.click()
  }

  if (loading) return <div className="p-6 text-sm text-text-secondary">Cargando...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Configuración</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-page transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Section title="Registro">
          <Toggle
            label="Registro abierto"
            description="Permite nuevos registros en el portal"
            checked={config.registrationOpen ?? false}
            onChange={(v) => setConfig((c) => ({ ...c, registrationOpen: v }))}
          />
          <Toggle
            label="Pago en efectivo habilitado"
            description="Permite que el admin registre pagos en efectivo en sitio"
            checked={config.cashPaymentEnabled ?? false}
            onChange={(v) => setConfig((c) => ({ ...c, cashPaymentEnabled: v }))}
          />
        </Section>

        <Section title="Precio y fechas">
          <Field label="Precio de registro (MXN)">
            <input
              type="number"
              value={config.price ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, price: Number(e.target.value) }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="800"
            />
          </Field>
          <Field label="Fecha límite de registro">
            <input
              type="datetime-local"
              value={config.registrationDeadline?.slice(0, 16) ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, registrationDeadline: new Date(e.target.value).toISOString() }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </Field>
          <Field label="Fecha límite de pago">
            <input
              type="datetime-local"
              value={config.paymentDeadline?.slice(0, 16) ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, paymentDeadline: new Date(e.target.value).toISOString() }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </Field>
          <Field label="Fecha límite de carta">
            <input
              type="datetime-local"
              value={config.cartaDeadline?.slice(0, 16) ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, cartaDeadline: new Date(e.target.value).toISOString() }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </Field>
        </Section>

        <Section title="Contacto">
          <Field label="Teléfono de contacto (se muestra si la iglesia no se encuentra)">
            <input
              type="tel"
              value={config.contactPhone ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, contactPhone: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="+529991234567"
            />
          </Field>
        </Section>

        {error && (
          <p className="text-sm text-error bg-red-50 border border-error/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-border'}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
