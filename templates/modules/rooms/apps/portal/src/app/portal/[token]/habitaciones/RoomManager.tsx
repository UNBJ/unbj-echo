'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Users, User, Check, X, ArrowLeft, Copy, Plus, Key, AlertCircle, Loader2, LogOut } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FadeIn } from '@/components/ui/motion'
import { useTranslations } from '@/hooks/useTranslations'

interface RoomManagerProps {
  registration: any
  token: string
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export function RoomManager({ registration, token }: RoomManagerProps) {
  const router = useRouter()
  const t = useTranslations('rooms')

  // Estados lógicos
  const [canSelect, setCanSelect] = useState(false)
  const [hasRoom, setHasRoom] = useState(false)
  const [room, setRoom] = useState<any>(null)
  const [pendingRequest, setPendingRequest] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])

  // Estados UI
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Formulario de creación
  const [createType, setCreateType] = useState<'double' | 'triple' | 'quadruple'>('double')
  const [createGender, setCreateGender] = useState<'M' | 'F' | 'mixed'>('mixed')
  const [createName, setCreateName] = useState('')

  // Formulario de unión
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [token])

  // Obtener estado general de hospedaje
  async function fetchStatus() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/logistic/rooms/status`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('errorLoad'))

      setCanSelect(data.canSelect)
      setHasRoom(data.hasRoom)
      setRoom(data.room)
      setPendingRequest(data.pendingRequest)

      // Si es responsable, obtener solicitudes de unión pendientes
      if (data.hasRoom && data.room?.responsibleUserId === registration.id) {
        await fetchRequests()
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorConnection'))
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener solicitudes de unión para el cuarto
  async function fetchRequests() {
    try {
      const res = await fetch(`${API_URL}/logistic/rooms/requests`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setRequests(data.requests || [])
      }
    } catch (err) {
      console.error('Error fetching requests:', err)
    }
  }

  // Crear Habitación
  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault()
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`${API_URL}/logistic/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: createType,
          gender: createGender,
          name: createName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear habitación')

      setSuccess('¡Habitación creada y registrada exitosamente!')
      await fetchStatus()
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorConnection'))
    } finally {
      setActionLoading(false)
    }
  }

  // Enviar solicitud de ingreso
  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCode) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`${API_URL}/logistic/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar solicitud')

      setSuccess('¡Solicitud de ingreso enviada correctamente!')
      await fetchStatus()
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorConnection'))
    } finally {
      setActionLoading(false)
    }
  }

  // Cancelar solicitud pendiente
  async function handleCancelRequest() {
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`${API_URL}/logistic/rooms/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al cancelar solicitud')

      setSuccess('Solicitud cancelada con éxito.')
      await fetchStatus()
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorConnection'))
    } finally {
      setActionLoading(false)
    }
  }

  // Salir de Habitación (o eliminar si es responsable único)
  async function handleLeaveRoom() {
    const isLeader = room?.responsibleUserId === registration.id
    const userCount = room?.enrolledUsers?.length || 0
    const msg = isLeader && userCount <= 1
      ? '¿Estás seguro de que deseas eliminar esta habitación? Todos los integrantes serán desalojados.'
      : '¿Estás seguro de que deseas salir de esta habitación?'

    if (!confirm(msg)) return

    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`${API_URL}/logistic/rooms/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al salir de la habitación')

      setSuccess(isLeader && userCount <= 1 ? 'Habitación eliminada.' : 'Has salido de la habitación.')
      await fetchStatus()
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorConnection'))
    } finally {
      setActionLoading(false)
    }
  }

  // Responder a una solicitud de ingreso (Aceptar/Rechazar)
  async function handleRespondRequest(requestId: string, action: 'accept' | 'reject') {
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`${API_URL}/logistic/rooms/requests/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al responder la solicitud')

      setSuccess(action === 'accept' ? 'Solicitud aceptada.' : 'Solicitud rechazada.')
      await fetchRequests()
      await fetchStatus()
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorConnection'))
    } finally {
      setActionLoading(false)
    }
  }

  // Copiar código de habitación al portapapeles
  function handleCopyCode() {
    if (!room?.id) return
    navigator.clipboard.writeText(room.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <FadeIn className="min-h-screen bg-bg-page flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-card/80 backdrop-blur border-b border-border h-16 px-6 md:px-12 flex items-center justify-between flex-shrink-0">
        <button 
          onClick={() => router.push(`/portal/${token}`)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backBtn')}</span>
        </button>
        <span className="font-heading font-semibold text-sm tracking-widest text-accent uppercase">
          {t('title')}
        </span>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-xl font-heading font-semibold tracking-tight text-text-primary mb-1">
            {t('title')}
          </h1>
          <p className="text-sm text-text-secondary">
            {t('subtitle')}
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 text-error rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold">{t('warningTitle')}</h4>
              <p className="text-xs mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-success/10 border border-success/20 text-success rounded-xl p-4 flex gap-3 items-start">
            <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold">{t('successTitle')}</h4>
              <p className="text-xs mt-0.5 leading-relaxed">{success}</p>
            </div>
          </div>
        )}

        {/* Bloque de Pago Pendiente */}
        {!canSelect && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-6 flex flex-col items-center text-center gap-4 max-w-md mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-warning" />
            <div>
              <h3 className="font-semibold text-lg text-text-primary">{t('pendingPayment')}</h3>
              <p className="text-sm mt-1 leading-relaxed text-text-secondary">
                {t('notAvailable')}
              </p>
            </div>
            <button 
              onClick={() => router.push(`/portal/${token}`)}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-6 py-2.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {t('goToPayment')}
            </button>
          </div>
        )}

        {canSelect && (
          <div>
            {!hasRoom ? (
              // VISTA SIN HABITACIÓN ASIGNADA
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Crear una nueva habitación */}
                <Card className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                        <Plus className="w-5 h-5" />
                      </div>
                      <h3 className="font-heading font-semibold text-base text-text-primary">{t('createRoomTitle')}</h3>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-5">
                      {t('createRoomText')}
                    </p>

                    <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">{t('roomTypeLabel') || t('capacity')}</label>
                        <select 
                          value={createType}
                          onChange={(e: any) => setCreateType(e.target.value)}
                          className="w-full border border-border rounded-lg bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150"
                        >
                          <option value="double">{t('doubleRoom')}</option>
                          <option value="triple">{t('tripleRoom')}</option>
                          <option value="quadruple">{t('quadRoom')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">{t('genderFilterLabel') || t('genderFilter')}</label>
                        <select 
                          value={createGender}
                          onChange={(e: any) => setCreateGender(e.target.value)}
                          className="w-full border border-border rounded-lg bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150"
                        >
                          <option value="mixed">{t('genderMixed')}</option>
                          <option value="M">{t('genderMen')}</option>
                          <option value="F">{t('genderWomen')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">{t('roomNameLabel')}</label>
                        <input 
                          type="text" 
                          placeholder={t('roomNamePlaceholder')}
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          className="w-full border border-border rounded-lg bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        loading={actionLoading} 
                        className="mt-2 w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg text-xs"
                      >
                        {t('createBtn')}
                      </Button>
                    </form>
                  </div>
                </Card>

                {/* 2. Unirse a una habitación existente */}
                <Card className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                        <Key className="w-5 h-5" />
                      </div>
                      <h3 className="font-heading font-semibold text-base text-text-primary">{t('joinRoomTitle')}</h3>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-5">
                      {t('joinRoomText')}
                    </p>

                    {pendingRequest ? (
                      // Solicitud pendiente actual
                      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-center mt-6">
                        <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
                        <h4 className="text-xs font-semibold text-text-primary">{t('requestSentTitle')}</h4>
                        <p className="text-xs text-text-secondary mt-1 leading-normal">
                          {t('requestSentText', { name: pendingRequest.roomName || pendingRequest.roomId })}. {t('requestPendingText')}
                        </p>
                        <button
                          onClick={handleCancelRequest}
                          disabled={actionLoading}
                          className="mt-3 text-xs font-semibold text-error hover:text-error/80 underline"
                        >
                          {t('cancelRequestBtn')}
                        </button>
                      </div>
                    ) : (
                      // Formulario de ingreso de código
                      <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">{t('joinCodeLabel') || t('inviteCode')}</label>
                          <input 
                            type="text" 
                            placeholder="Ej: ABC-123" 
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="w-full border border-border rounded-lg bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary uppercase focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150"
                          />
                        </div>

                        <Button 
                          type="submit" 
                          disabled={!joinCode || actionLoading}
                          loading={actionLoading}
                          className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg text-xs"
                        >
                          {t('joinBtn')}
                        </Button>
                      </form>
                    )}
                  </div>
                </Card>

              </div>
            ) : (
              // VISTA CON HABITACIÓN ASIGNADA
              <div className="flex flex-col gap-6">
                
                {/* Detalles del Cuarto */}
                <Card className="relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                        <Home className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-heading font-semibold text-text-primary">{room?.name}</h2>
                        <p className="text-xs text-text-secondary capitalize">
                          {t('roomType')} {room?.type === 'double' ? t('doubleName') : room?.type === 'triple' ? t('tripleName') : t('quadName')} · {t('genderFilter')} {room?.gender === 'M' ? t('genderMen') : room?.gender === 'F' ? t('genderWomen') : t('genderMixed')}
                        </p>
                      </div>
                    </div>

                    {/* Código del Cuarto */}
                    <div className="bg-bg-subtle border border-border rounded-xl px-4 py-2 flex items-center gap-3">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-text-secondary tracking-wider block">{t('invitedLabel')}</span>
                        <span className="text-base font-semibold font-mono text-text-primary tracking-wider">{room?.id}</span>
                      </div>
                      <button 
                        onClick={handleCopyCode}
                        className="p-1.5 hover:bg-border/50 rounded-lg text-text-secondary hover:text-text-primary transition-all"
                        title="Copiar Código"
                      >
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Integrantes del Cuarto */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{t('members')} ({room?.enrolledUsers?.length}/{room?.capacity})</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {room?.enrolledUsers?.map((member: any) => {
                        const isResponsible = member.userId === room.responsibleUserId
                        return (
                          <div 
                            key={member.userId} 
                            className="flex items-center justify-between p-3.5 border border-border bg-bg-subtle rounded-xl"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-text-primary truncate">{member.name}</span>
                            </div>

                            {isResponsible && (
                              <Badge tone="accent">{t('leader')}</Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Botón Salir */}
                  <div className="pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={handleLeaveRoom}
                      disabled={actionLoading}
                      className="text-xs font-medium text-error hover:text-error/80 flex items-center gap-1.5 px-3 py-2 hover:bg-error/10 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{room?.enrolledUsers?.length <= 1 ? t('deleteBtn') : t('leaveBtn')}</span>
                    </button>
                  </div>
                </Card>

                {/* Solicitudes de Unión Pendientes (Solo Responsables) */}
                {room?.responsibleUserId === registration.id && (
                  <Card>
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                      {t('pendingRequests')}
                    </h3>

                    {requests.length === 0 ? (
                      <EmptyState icon={Users} title={t('noPendingRequests')} />
                    ) : (
                      <div className="flex flex-col gap-3">
                        {requests.map((req: any) => (
                          <div 
                            key={req.id} 
                            className="flex items-center justify-between p-3 border border-border rounded-xl bg-bg-subtle"
                          >
                            <div className="min-w-0 pr-4">
                              <p className="text-xs font-semibold text-text-primary truncate">{req.userName}</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">{t('requestedAgo', { date: new Date(req.createdAt).toLocaleDateString() })}</p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespondRequest(req.id, 'accept')}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all"
                                title={t('acceptBtn')}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRespondRequest(req.id, 'reject')}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all"
                                title={t('rejectBtn')}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

              </div>
            )}
          </div>
        )}
      </main>
    </FadeIn>
  )
}
