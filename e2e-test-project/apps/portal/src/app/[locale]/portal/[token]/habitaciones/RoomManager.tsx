'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Users, User, Check, X, ArrowLeft, Copy, Plus, Key, AlertCircle, Loader2, LogOut } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { clsx } from 'clsx'


import { useTranslations } from 'next-intl'


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
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      {/* Header */}
      <header className="bg-[#1E293B] text-white h-16 px-6 md:px-12 flex items-center justify-between flex-shrink-0">
        <button 
          onClick={() => router.push(`/portal/${token}`)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backBtn')}</span>
        </button>
        <span className="font-heading font-bold text-sm tracking-widest text-indigo-400 uppercase">
          {t('title')}
        </span>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-1">
            {t('title')}
          </h1>
          <p className="text-sm text-text-secondary">
            {t('subtitle')}
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">{t('warningTitle')}</h4>
              <p className="text-xs mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex gap-3 items-start">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">{t('successTitle')}</h4>
              <p className="text-xs mt-0.5 leading-relaxed">{success}</p>
            </div>
          </div>
        )}

        {/* Bloque de Pago Pendiente */}
        {!canSelect && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-6 flex flex-col items-center text-center gap-4 max-w-md mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <div>
              <h3 className="font-bold text-lg text-amber-950">{t('pendingPayment')}</h3>
              <p className="text-sm mt-1 leading-relaxed">
                {t('notAvailable')}
              </p>
            </div>
            <button 
              onClick={() => router.push(`/portal/${token}`)}
              className="bg-[#1E293B] hover:bg-[#2d3b50] text-white text-xs font-semibold px-6 py-2.5 rounded-lg transition-colors"
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
                <Card className="bg-white border border-border p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Plus className="w-5 h-5" />
                      </div>
                      <h3 className="font-heading font-bold text-base text-text-primary">{t('createRoomTitle')}</h3>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-5">
                      {t('createRoomText')}
                    </p>

                    <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('roomTypeLabel') || t('capacity')}</label>
                        <select 
                          value={createType}
                          onChange={(e: any) => setCreateType(e.target.value)}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text-primary bg-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="double">{t('doubleRoom')}</option>
                          <option value="triple">{t('tripleRoom')}</option>
                          <option value="quadruple">{t('quadRoom')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('genderFilterLabel') || t('genderFilter')}</label>
                        <select 
                          value={createGender}
                          onChange={(e: any) => setCreateGender(e.target.value)}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text-primary bg-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="mixed">{t('genderMixed')}</option>
                          <option value="M">{t('genderMen')}</option>
                          <option value="F">{t('genderWomen')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('roomNameLabel')}</label>
                        <input 
                          type="text" 
                          placeholder={t('roomNamePlaceholder')}
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        loading={actionLoading} 
                        className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs"
                      >
                        {t('createBtn')}
                      </Button>
                    </form>
                  </div>
                </Card>

                {/* 2. Unirse a una habitación existente */}
                <Card className="bg-white border border-border p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-violet-50 text-violet-600">
                        <Key className="w-5 h-5" />
                      </div>
                      <h3 className="font-heading font-bold text-base text-text-primary">{t('joinRoomTitle')}</h3>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-5">
                      {t('joinRoomText')}
                    </p>

                    {pendingRequest ? (
                      // Solicitud pendiente actual
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mt-6">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-amber-950">{t('requestSentTitle')}</h4>
                        <p className="text-xs text-amber-900 mt-1 leading-normal">
                          {t('requestSentText', { name: pendingRequest.roomName || pendingRequest.roomId })}. {t('requestPendingText')}
                        </p>
                        <button
                          onClick={handleCancelRequest}
                          disabled={actionLoading}
                          className="mt-3 text-xs font-bold text-red-600 hover:text-red-700 underline"
                        >
                          {t('cancelRequestBtn')}
                        </button>
                      </div>
                    ) : (
                      // Formulario de ingreso de código
                      <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">{t('joinCodeLabel') || t('inviteCode')}</label>
                          <input 
                            type="text" 
                            placeholder="Ej: ABC-123" 
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary uppercase focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        <Button 
                          type="submit" 
                          disabled={!joinCode || actionLoading}
                          loading={actionLoading}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-lg text-xs"
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
                <Card className="bg-white border border-border rounded-xl p-6 relative overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-indigo-500/60 via-violet-500/80 to-indigo-500/60 absolute top-0 left-0 right-0" />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Home className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-heading font-bold text-text-primary">{room?.name}</h2>
                        <p className="text-xs text-text-secondary capitalize">
                          {t('roomType')} {room?.type === 'double' ? t('doubleName') : room?.type === 'triple' ? t('tripleName') : t('quadName')} · {t('genderFilter')} {room?.gender === 'M' ? t('genderMen') : room?.gender === 'F' ? t('genderWomen') : t('genderMixed')}
                        </p>
                      </div>
                    </div>

                    {/* Código del Cuarto */}
                    <div className="bg-bg-page border border-border rounded-xl px-4 py-2 flex items-center gap-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-text-secondary tracking-wider block">{t('invitedLabel')}</span>
                        <span className="text-base font-bold font-mono text-text-primary tracking-wider">{room?.id}</span>
                      </div>
                      <button 
                        onClick={handleCopyCode}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-text-secondary hover:text-text-primary transition-all"
                        title="Copiar Código"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Integrantes del Cuarto */}
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{t('members')} ({room?.enrolledUsers?.length}/{room?.capacity})</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {room?.enrolledUsers?.map((member: any) => {
                        const isResponsible = member.userId === room.responsibleUserId
                        return (
                          <div 
                            key={member.userId} 
                            className="flex items-center justify-between p-3.5 border border-border bg-gray-50/50 rounded-xl"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-text-primary truncate">{member.name}</span>
                            </div>

                            {isResponsible && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                {t('leader')}
                              </span>
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
                      className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{room?.enrolledUsers?.length <= 1 ? t('deleteBtn') : t('leaveBtn')}</span>
                    </button>
                  </div>
                </Card>

                {/* Solicitudes de Unión Pendientes (Solo Responsables) */}
                {room?.responsibleUserId === registration.id && (
                  <Card className="bg-white border border-border rounded-xl p-6">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
                      {t('pendingRequests')}
                    </h3>

                    {requests.length === 0 ? (
                      <p className="text-xs text-text-secondary text-center py-4">
                        {t('noPendingRequests')}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {requests.map((req: any) => (
                          <div 
                            key={req.id} 
                            className="flex items-center justify-between p-3 border border-border rounded-xl bg-gray-50/30"
                          >
                            <div className="min-w-0 pr-4">
                              <p className="text-xs font-bold text-text-primary truncate">{req.userName}</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">{t('requestedAgo', { date: new Date(req.createdAt).toLocaleDateString() })}</p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespondRequest(req.id, 'accept')}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                                title={t('acceptBtn')}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRespondRequest(req.id, 'reject')}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
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
    </div>
  )
}
