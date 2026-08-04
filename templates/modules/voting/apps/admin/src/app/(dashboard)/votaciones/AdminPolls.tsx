'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { Vote, Plus, Play, Square, Loader2, Award, ExternalLink, BarChart3, AlertCircle, Trash2, CheckCircle2, Maximize, Minimize } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export function AdminPolls() {
  // Datos
  const [polls, setPolls] = useState<any[]>([])
  const [activePoll, setActivePoll] = useState<any>(null)
  
  // Creación de propuesta
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newOptions, setNewOptions] = useState<string[]>(['', ''])
  
  // UI estados
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [projectorMode, setProjectorMode] = useState(false)

  useEffect(() => {
    fetchPolls()

    // Suscribirse al documento activo en tiempo real
    const activeDocRef = doc(db, 'polls', 'active')
    const unsubActive = onSnapshot(activeDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setActivePoll(data)
      } else {
        setActivePoll(null)
      }
    })

    return () => unsubActive()
  }, [])

  // Obtener todos los sondeos creados
  async function fetchPolls() {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('adminToken') || ''
    try {
      const res = await fetch(`${API_URL}/admin/polls`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al cargar votaciones')
      
      setPolls(data.polls || [])
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error de conexión.')
    } finally {
      setLoading(false)
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
    const token = localStorage.getItem('adminToken') || ''

    try {
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
    const token = localStorage.getItem('adminToken') || ''

    try {
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
      <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A1A2E] mb-3" />
        <p className="text-sm">Cargando módulo de votación...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* MODO PROYECTOR - OVERLAY FULLSCREEN */}
      {projectorMode && activePoll && (
        <div className="fixed inset-0 bg-[#0F172A] z-50 text-white flex flex-col p-12 justify-between">
          <div className="flex justify-between items-center border-b border-white/10 pb-5">
            <div className="flex items-center gap-4">
              <Vote className="w-10 h-10 text-rose-500 animate-pulse" />
              <div>
                <span className="text-xs uppercase font-semibold text-rose-400 tracking-[0.25em]">Votación en Vivo</span>
                <h1 className="text-3xl font-heading font-bold">{activePoll.title}</h1>
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
                  <div className="flex justify-between items-center text-xl font-bold px-2">
                    <span>{opt.text}</span>
                    <span className="font-mono text-2xl text-rose-400">
                      {votes} {votes === 1 ? 'voto' : 'votos'} ({percentage}%)
                    </span>
                  </div>
                  {/* Barra de Progreso Grande */}
                  <div className="w-full h-10 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center border-t border-white/10 pt-5 text-sm text-white/50">
            <span>Registros de Votación Encriptados y Asegurados</span>
            <span className="font-bold text-lg text-white">Votos Totales: {totalVotes}</span>
          </div>
        </div>
      )}

      {/* TITULO Y ALERTAS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Votación en Tiempo Real</h1>
          <p className="text-sm text-text-secondary">Controla propuestas, monitorea resultados en vivo y proyecta gráficos.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Error</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Acción exitosa</h4>
            <p className="text-xs mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {/* SONDEO ACTIVO MONITOR */}
      {activePoll && activePoll.status === 'active' && (
        <Card className="bg-white border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="h-[4px] bg-rose-500 absolute top-0 left-0 right-0" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 animate-pulse">
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block">Monitoreando Votación en Curso</span>
                <h2 className="text-base font-heading font-bold text-text-primary mt-0.5">{activePoll.title}</h2>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setProjectorMode(true)}
                className="bg-gray-100 hover:bg-gray-200 text-text-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
              >
                <Maximize className="w-4 h-4" />
                <span>Vista Proyector</span>
              </Button>
              <Button
                onClick={() => handleTogglePoll(activePoll.proposalId, 'close')}
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
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
                  <div className="flex justify-between items-center text-xs font-bold text-text-primary">
                    <span>{opt.text}</span>
                    <span className="font-mono">{votes} votos ({percentage}%)</span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-300"
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
        <Card className="bg-white border border-border p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-text-secondary" />
            <span>Propuestas de Votación</span>
          </h2>

          {polls.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <Vote className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No has creado propuestas de votación aún.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {polls.map((p) => {
                const isCurrentActive = activePoll?.proposalId === p.proposalId && activePoll?.status === 'active'
                const isClosed = p.status === 'closed'
                const totalPollVotes = Object.values(p.results || {}).reduce((sum: number, val: any) => sum + val, 0) as number

                return (
                  <div 
                    key={p.proposalId} 
                    className={`border border-border p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/20`}
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-text-primary text-sm truncate">{p.title}</h3>
                        
                        {isCurrentActive && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 animate-pulse">
                            EN CURSO
                          </span>
                        )}
                        {isClosed && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                            CERRADA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-1">{p.description || 'Sin descripción'}</p>
                      
                      {/* Mostrar resultados de propuestas cerradas */}
                      {isClosed && (
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-text-secondary bg-gray-100/50 px-2 py-1 rounded">
                          <span>Votos Totales: <strong>{totalPollVotes}</strong></span>
                          <span>|</span>
                          {p.options.map((opt: any) => (
                            <span key={opt.id}>{opt.text}: <strong>{p.results?.[opt.id] ?? 0}</strong></span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex gap-2">
                      {!isClosed && !isCurrentActive && (
                        <Button
                          onClick={() => handleTogglePoll(p.proposalId, 'activate')}
                          disabled={submitting || (activePoll && activePoll.status === 'active')}
                          className="bg-[#1A1A2E] hover:bg-[#2d2d50] text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Lanzar</span>
                        </Button>
                      )}

                      {isCurrentActive && (
                        <Button
                          onClick={() => handleTogglePoll(p.proposalId, 'close')}
                          disabled={submitting}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1"
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
        <Card className="bg-white border border-border p-6 rounded-2xl shadow-sm self-start">
          <h2 className="text-base font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-text-secondary" />
            <span>Nueva Propuesta</span>
          </h2>

          <form onSubmit={handleCreatePoll} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Título de la Propuesta</label>
              <input 
                type="text" 
                required
                placeholder="Ej: ¿Se aprueba el balance financiero?" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-[#1A1A2E]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Descripción / Notas</label>
              <textarea 
                placeholder="Detalle de la moción en votación" 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-[#1A1A2E] h-20 resize-none"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-text-secondary uppercase">Opciones de Respuesta</label>
                {newOptions.length < 5 && (
                  <button 
                    type="button" 
                    onClick={addOptionField}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
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
                  className="w-full border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-[#1A1A2E]"
                />
              ))}
            </div>

            <Button 
              type="submit" 
              loading={submitting} 
              className="mt-2 w-full bg-[#1A1A2E] hover:bg-[#2d2d50] text-white font-semibold py-2.5 rounded-lg text-xs"
            >
              Guardar Propuesta
            </Button>
          </form>
        </Card>

      </div>

    </div>
  )
}
