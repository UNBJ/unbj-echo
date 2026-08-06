'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { branding } from '@unbj/shared'
import { Monogram } from '@/components/ui/Monogram'
import { FadeIn } from '@/components/ui/motion'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      router.replace('/registros')
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page px-4">
      <FadeIn className="w-full max-w-sm">
        <div className="bg-bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="mb-8">
            <Monogram size="lg" className="mb-4" />
            <h1 className="text-2xl font-heading font-semibold tracking-tight text-text-primary">Panel Admin</h1>
            {branding.eventName && (
              <p className="text-sm text-text-secondary mt-1">{branding.eventName}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-border rounded-lg bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-border rounded-lg bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150"
              />
            </div>

            {error && (
              <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2 animate-fade-in">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Iniciar sesión
            </button>
          </form>
        </div>
      </FadeIn>
    </div>
  )
}
