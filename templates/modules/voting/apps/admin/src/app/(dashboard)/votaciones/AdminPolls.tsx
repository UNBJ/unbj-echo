'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Vote, Plus, Play, Square, BarChart3, AlertCircle, CheckCircle2, Maximize, Minimize } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { FadeIn } from '@/components/ui/motion'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export function AdminPolls() {
  const { getToken } = useAuth()
  const [polls, setPolls] = useState<any[]>([])
  const [activePoll, setActivePoll] = useState<any>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newOptions, setNewOptions] = useState<string[]>(['', ''])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [projectorMode, setProjectorMode] = useState(false)

  useEffect(() => {
    void fetchPolls()

    const intervalId = window.setInterval(() => {
      void fetchPolls(false)
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [])

  async function fetchPolls(showLoader = true) {
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/admin/polls`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al cargar votaciones')
      
      setPolls(data.polls || [])
      setActivePoll(data.activePoll ?? null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error de conexión.')
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  // Crear propuesta
  async function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault()
    const optionsFiltered = newOptions.map(o => o.trim()).filter(Boolean)
    if (optionsFiltered.length < 2) {
      setError('Debes ingresar al menos 2 opciones de respuesta.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/admin/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          options: optionsFiltered,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear la propuesta')

      setSuccess('Propuesta de votación creada correctamente.')
      setNewTitle('')
      setNewDesc('')
      setNewOptions(['', ''])
      await fetchPolls()
    } catch (err: any) {
      setError(err.message || 'Error al guardar la propuesta.')
    } finally {
      setSubmitting(false)
    }
  }

  // Activar o Cerrar Votación
  async function handleTogglePoll(pollId: string, action: 'activate' | 'close') {
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/admin/polls/${pollId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al cambiar estado')

      setSuccess(`Votación ${action === 'activate' ? 'activada' : 'cerrada'} correctamente.`)
      await fetchPolls()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el estado de la propuesta.')
    } finally {
      setSubmitting(false)
    }
  }

  // Modificar cantidad de opciones en formulario
  function addOptionField() {
    if (newOptions.length >= 6) return
    setNewOptions(prev => [...prev, ''])
  }

  function handleOptionChange(index: number, val: string) {
    setNewOptions(prev => {
      const copy = [...prev]
      copy[index] = val
      return copy
    })
  }

  // Cálculos de porcentaje de votos
  const results = activePoll?.results || {}
  const totalVotes = Object.values(results).reduce((sum: number, val: any) => sum + val, 0) as number

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <FadeIn className="flex flex-col gap-8">
      
      {/* MODO PROYECTOR - OVERLAY FULLSCREEN */}
      {projectorMode && activePoll && (
        <div className="fixed inset-0 bg-bg-sidebar z-50 text-text-on-dark flex flex-col p-12 justify-between">
          <div className="flex justify-between items-center border-b border-white/10 pb-5">
            <div className="flex items-center gap-4">
              <Vote className="w-10 h-10 text-accent animate-pulse" />
              <div>
                <span className="text-xs uppercase font-semibold text-accent tracking-[0.25em]">Votación en Vivo</span>
                <h1 className="text-3xl font-heading font-semibold">{activePoll.title}</h1>
              </div>
            </div>
            <button 
              onClick={() => setProjectorMode(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-all flex items-center gap-2"
            >
              <Minimize className="w-4 h-4" />
              <span>Cerrar Vista Proyector</span>
            </button>
          </div>

          {/* Resultados en tiempo real gigantes */}
          <div className="my-auto max-w-4xl w-full mx-auto flex flex-col gap-6">
            {activePoll.options.map((opt: any) => {
              const votes = results[opt.id] ?? 0
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

              return (
                <div key={opt.id} className="relative flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xl font-semibold px-2">
                    <span>{opt.text}</span>
                    <span className="font-mono text-2xl text-accent">
                      {votes} {votes === 1 ? 'voto' : 'votos'} ({percentage}%)
                    </span>
                  </div>
                  {/* Barra de Progreso Grande */}
                  <div className="w-full h-10 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center border-t border-white/10 pt-5 text-sm text-text-on-dark/50">
            <span>Registros de Votación Encriptados y Asegurados</span>
            <span className="font-semibold text-lg text-text-on-dark">Votos Totales: {totalVotes}</span>
          </div>
        </div>
      )}

      {/* TITULO Y ALERTAS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-heading font-semibold tracking-tight text-text-primary">Votación en Tiempo Real</h1>
          <p className="text-sm text-text-secondary">Controla propuestas, monitorea resultados en vivo y proyecta gráficos.</p>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold">Error</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success/20 text-success rounded-xl p-4 flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold">Acción exitosa</h4>
            <p className="text-xs mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {/* SONDEO ACTIVO MONITOR */}
      {activePoll && activePoll.status === 'active' && (
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10 text-accent animate-pulse">
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-accent uppercase tracking-widest block">Monitoreando Votación en Curso</span>
                <h2 className="text-base font-heading font-semibold text-text-primary mt-0.5">{activePoll.title}</h2>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="secondary"
                onClick={() => setProjectorMode(true)}
                className="text-xs px-4 py-2 flex items-center gap-1.5"
              >
                <Maximize className="w-4 h-4" />
                <span>Vista Proyector</span>
              </Button>
              <Button
                onClick={() => handleTogglePoll(activePoll.proposalId, 'close')}
                disabled={submitting}
                className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-4 py-2 flex items-center gap-1.5"
              >
                <Square className="w-4 h-4" />
                <span>Cerrar Votación</span>
              </Button>
            </div>
          </div>

          {/* Gráfico / Barras de progreso de resultados en vivo */}
          <div className="flex flex-col gap-4 max-w-2xl">
            {activePoll.options.map((opt: any) => {
              const votes = results[opt.id] ?? 0
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

              return (
                <div key={opt.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-text-primary">
                    <span>{opt.text}</span>
                    <span className="font-mono">{votes} votos ({percentage}%)</span>
                  </div>
                  <div className="w-full h-4 bg-bg-subtle rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="mt-2 text-right text-xs font-semibold text-text-secondary">
              Votos totales recibidos: <strong className="text-text-primary">{totalVotes}</strong>
            </div>
          </div>
        </Card>
      )}

      {/* GRID: NUEVO Y LISTA */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        
        {/* LISTA DE PROPUESTAS */}
        <Card>
          <h2 className="text-base font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-text-secondary" />
            <span>Propuestas de Votación</span>
          </h2>

          {polls.length === 0 ? (
            <EmptyState icon={Vote} title="No has creado propuestas de votación aún." />
          ) : (
            <div className="flex flex-col gap-4">
              {polls.map((p) => {
                const isCurrentActive = activePoll?.proposalId === p.proposalId && activePoll?.status === 'active'
                const isClosed = p.status === 'closed'
                const totalPollVotes = Object.values(p.results || {}).reduce((sum: number, val: any) => sum + val, 0) as number

                return (
                  <div 
                    key={p.proposalId} 
                    className={`border border-border p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-subtle`}
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-text-primary text-sm truncate">{p.title}</h3>
                        
                        {isCurrentActive && (
                          <Badge tone="accent" className="animate-pulse">
                            EN CURSO
                          </Badge>
                        )}
                        {isClosed && (
                          <Badge tone="neutral">
                            CERRADA
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-1">{p.description || 'Sin descripción'}</p>
                      
                      {/* Mostrar resultados de propuestas cerradas */}
                      {isClosed && (
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-text-secondary bg-bg-card border border-border px-2 py-1 rounded">
                          <span>Votos Totales: <strong>{totalPollVotes}</strong></span>
                          <span>|</span>
                          {p.options.map((opt: any) => (
                            <span key={opt.id}>{opt.text}: <strong>{p.results?.[opt.id] ?? 0}</strong></span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex gap-2">
                      {p.status === 'draft' && !isCurrentActive && (
                        <Button
                          onClick={() => handleTogglePoll(p.proposalId, 'activate')}
                          disabled={submitting || (activePoll && activePoll.status === 'active')}
                          className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Lanzar</span>
                        </Button>
                      )}

                      {isCurrentActive && (
                        <Button
                          onClick={() => handleTogglePoll(p.proposalId, 'close')}
                          disabled={submitting}
                          className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 flex items-center gap-1"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Cerrar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* CREAR PROPUESTA */}
        <Card className="self-start">
          <h2 className="text-base font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-text-secondary" />
            <span>Nueva Propuesta</span>
          </h2>

          <form onSubmit={handleCreatePoll} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">Título de la Propuesta</label>
              <input 
                type="text" 
                required
                placeholder="Ej: ¿Se aprueba el balance financiero?" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-border rounded-lg bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">Descripción / Notas</label>
              <textarea 
                placeholder="Detalle de la moción en votación" 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full border border-border rounded-lg bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150 h-20 resize-none"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-semibold text-text-secondary uppercase">Opciones de Respuesta</label>
                {newOptions.length < 5 && (
                  <button 
                    type="button" 
                    onClick={addOptionField}
                    className="text-[10px] font-semibold text-accent hover:text-accent-hover"
                  >
                    + Agregar
                  </button>
                )}
              </div>

              {newOptions.map((opt, i) => (
                <input 
                  key={i}
                  type="text"
                  required
                  placeholder={`Opción ${i + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  className="w-full border border-border rounded-lg bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150"
                />
              ))}
            </div>

            <Button 
              type="submit" 
              loading={submitting} 
              className="mt-2 w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg text-xs"
            >
              Guardar Propuesta
            </Button>
          </form>
        </Card>

      </div>

    </FadeIn>
  )
}
