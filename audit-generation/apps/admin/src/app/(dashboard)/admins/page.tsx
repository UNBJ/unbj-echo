'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { listUsers, createUser, deleteUser, type AdminUser } from '@/lib/api'
import { Trash2, Plus, ShieldCheck, Shield } from 'lucide-react'
import { clsx } from 'clsx'

export default function AdminsPage() {
  const { getToken, user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const token = await getToken()
      const { users: list } = await listUsers(token)
      setUsers(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(uid: string) {
    if (!confirm('¿Eliminar este administrador?')) return
    try {
      const token = await getToken()
      await deleteUser(token, uid)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Administradores</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo admin
        </button>
      </div>

      {error && <p className="text-sm text-error mb-4">{error}</p>}

      {showForm && (
        <UserForm
          onSave={async (data) => {
            const token = await getToken()
            await createUser(token, data)
            setShowForm(false)
            await load()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-text-secondary text-center py-8">Cargando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-page">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Creado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{u.name || '—'}</p>
                    <p className="text-xs text-text-secondary">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-1 rounded-full',
                      u.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-700'
                    )}>
                      {u.role === 'super_admin'
                        ? <><ShieldCheck className="w-3 h-3" /> Super Admin</>
                        : <><Shield className="w-3 h-3" /> Admin</>
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.email !== user?.email && (
                      <button onClick={() => handleDelete(u.uid)} className="text-error hover:text-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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

function UserForm({
  onSave,
  onCancel,
}: {
  onSave: (data: { email: string; name: string; password: string; role: 'admin' | 'super_admin' }) => Promise<void>
  onCancel: () => void
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({ email, name, password, role })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4 flex flex-col gap-3">
      <h3 className="font-semibold text-text-primary text-sm">Nuevo administrador</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Correo</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Contraseña (mín. 8 caracteres)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 bg-white">
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
          {saving ? 'Creando...' : 'Crear administrador'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-sm rounded-lg transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
