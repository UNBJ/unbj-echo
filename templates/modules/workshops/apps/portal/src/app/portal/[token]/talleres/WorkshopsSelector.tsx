'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslations } from '@/hooks/useTranslations'

interface WorkshopsSelectorProps {
  registration: any
  token: string
  locale: string
}

interface Workshop {
  id: string
  name: string
  description: string
  speaker: string
  date: string
  place: string
  capacity: number
  currentAssistants: number
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export function WorkshopsSelector({ registration, token, locale }: WorkshopsSelectorProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'martes' | 'miercoles' | 'jueves'>('martes')
  const t = useTranslations('workshops')

  // Estados de datos
  const [availableWorkshops, setAvailableWorkshops] = useState<Record<string, Workshop[]>>({
    martes: [],
    miercoles: [],
    jueves: [],
  })
  const [selectedWorkshops, setSelectedWorkshops] = useState<any[]>([])
  
  // Estados lógicos
  const [hasSelected, setHasSelected] = useState(false)
  const [canSelect, setCanSelect] = useState(false)
  const [pendingBalance, setPendingBalance] = useState<number | null>(null)
  
  // Estados UI
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Selección actual en UI antes de guardar
  const [selection, setSelection] = useState<Record<string, string>>({
    martes: '',
    miercoles: '',
    jueves: '',
  })

  useEffect(() => {
    fetchWorkshopsData()
  }, [token])

  async function fetchWorkshopsData() {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Obtener estado de talleres del usuario
      const statusRes = await fetch(`${API_URL}/logistic/my-studios`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const statusData = await statusRes.json()
      if (!statusRes.ok) throw new Error(statusData.error ?? t('errorLoad'))

      setHasSelected(statusData.hasSelected)
      setCanSelect(statusData.canSelect)
      setPendingBalance(statusData.pendingBalance)
      setSelectedWorkshops(statusData.selectedStudios || [])

      if (statusData.hasSelected && statusData.selectedStudios) {
        const initialSel: Record<string, string> = {}
        statusData.selectedStudios.forEach((s: any) => {
          if (s.day === 'Martes') initialSel.martes = s.id
          if (s.day === 'Miércoles') initialSel.miercoles = s.id
          if (s.day === 'Jueves') initialSel.jueves = s.id
        })
        setSelection(initialSel)
      }

      // 2. Obtener lista de todos los talleres disponibles
      const availRes = await fetch(`${API_URL}/logistic/studios`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const dataAvail = await availRes.json()
      if (!availRes.ok) throw new Error(dataAvail.error ?? t('errorLoad'))

      setAvailableWorkshops(dataAvail.studios || { martes: [], miercoles: [], jueves: [] })
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorLoad'))
    } finally {
      setIsLoading(false)
    }
  }

  function handleSelectWorkshop(day: 'martes' | 'miercoles' | 'jueves', id: string) {
    setSelection(prev => ({
      ...prev,
      [day]: prev[day] === id ? '' : id, // toggle selection
    }))
  }

  async function handleSubmitSelection() {
    setIsSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    const ids = Object.values(selection).filter(Boolean)
    try {
      const res = await fetch(`${API_URL}/logistic/studios/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ studioIds: ids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('errorSubmit'))

      setSuccessMsg(t('successRegister'))
      setHasSelected(true)
      
      // Recargar datos actualizados
      await fetchWorkshopsData()
    } catch (err: any) {
      setError(err.message || t('errorSubmit'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSelectionComplete = selection.martes && selection.miercoles && selection.jueves

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
        <span className="font-heading font-bold text-sm tracking-widest text-blue-400 uppercase">
          {t('title')}
        </span>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-1">
            {t('eventTitle')}
          </h1>
          <p className="text-sm text-text-secondary">
            {hasSelected 
              ? t('enrolledText') 
              : t('chooseText')}
          </p>
        </div>

        {/* Rejection / Warning Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">{t('warningTitle')}</h4>
              <p className="text-xs mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex gap-3 items-start">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">{t('successTitle')}</h4>
              <p className="text-xs mt-0.5 leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Pago Pendiente Block */}
        {!hasSelected && !canSelect && pendingBalance !== null && pendingBalance > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-6 flex flex-col items-center text-center gap-4 max-w-md mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <div>
              <h3 className="font-bold text-lg text-amber-950">{t('pendingPayment')}</h3>
              <p className="text-sm mt-1 leading-relaxed">
                {t('pendingPaymentText')}
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

        {/* Vista: Talleres ya Seleccionados (Read Only) */}
        {hasSelected && (
          <div className="flex flex-col gap-4">
            <div className="bg-green-50/50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-950 font-medium">{t('completedText')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {selectedWorkshops.map((ws) => (
                <div key={ws.id} className="bg-bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-blue-500 uppercase">{ws.day}</span>
                    <h3 className="font-bold text-text-primary text-base mt-1.5 leading-snug">{ws.name}</h3>
                    <p className="text-xs text-text-secondary mt-1">{t('by')}{ws.speaker}</p>
                    <p className="text-xs text-text-secondary mt-3 leading-relaxed line-clamp-4">{ws.description}</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-border flex flex-col gap-1.5 text-[11px] text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                      <span>{ws.place}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vista: Formulario de Selección (Interactive) */}
        {!hasSelected && canSelect && (
          <div>
            {/* Tabs Header */}
            <div className="flex border-b border-border mb-6">
              {(['martes', 'miercoles', 'jueves'] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveTab(day)}
                  className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 capitalize transition-all ${
                    activeTab === day
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t(day)}
                </button>
              ))}
            </div>

            {/* Workshops List for active day */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {availableWorkshops[activeTab]?.map((ws) => {
                const isSelected = selection[activeTab] === ws.id
                const isFull = ws.currentAssistants >= ws.capacity

                return (
                  <div 
                    key={ws.id}
                    onClick={() => !isFull && handleSelectWorkshop(activeTab, ws.id)}
                    className={`border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/10 ring-1 ring-blue-600' 
                        : isFull 
                          ? 'border-border bg-gray-50/50 opacity-60 cursor-not-allowed'
                          : 'border-border hover:border-blue-500/40 hover:bg-blue-500/[0.01]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-text-primary text-base leading-snug">{ws.name}</h3>
                        {isFull && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 whitespace-nowrap">
                            {t('full')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{t('by')}{ws.speaker}</p>
                      <p className="text-xs text-text-secondary mt-3 leading-relaxed line-clamp-3">{ws.description}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{ws.place}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{t('spacesAvailable', { count: ws.capacity - ws.currentAssistants })}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {availableWorkshops[activeTab]?.length === 0 && (
                <p className="text-sm text-text-secondary col-span-2 text-center py-8">
                  {t('noWorkshops')}
                </p>
              )}
            </div>

            {/* Bottom Bar: Resumen de selección y botón de guardar */}
            <div className="bg-bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-bold text-text-primary">{t('yourSelection')}</h4>
                <p className="text-xs text-text-secondary mt-1">
                  {t('martes')}: <span className="font-semibold text-text-primary">{availableWorkshops.martes?.find(w => w.id === selection.martes)?.name || t('none')}</span> | 
                  {t('miercoles')}: <span className="font-semibold text-text-primary">{availableWorkshops.miercoles?.find(w => w.id === selection.miercoles)?.name || t('none')}</span> | 
                  {t('jueves')}: <span className="font-semibold text-text-primary">{availableWorkshops.jueves?.find(w => w.id === selection.jueves)?.name || t('none')}</span>
                </p>
              </div>

              <button
                disabled={!isSelectionComplete || isSubmitting}
                onClick={handleSubmitSelection}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('saveBtn')}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
