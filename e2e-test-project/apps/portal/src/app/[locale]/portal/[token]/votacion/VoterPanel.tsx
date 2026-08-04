'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { ArrowLeft, Vote, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'


import { useTranslations } from 'next-intl'


interface VoterPanelProps {
  registration: any
  token: string
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export function VoterPanel({ registration: initialReg, token }: VoterPanelProps) {
  const router = useRouter()
  
  
  const t = useTranslations('voting')
  

  // Estados de datos en tiempo real
  const [activePoll, setActivePoll] = useState<any>(null)
  const [votedPolls, setVotedPolls] = useState<string[]>(initialReg.votedPolls || [])

  // Estados UI
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // 1. Escuchar la propuesta activa en tiempo real
    const activeDocRef = doc(db, 'polls', 'active')
    const unsubActive = onSnapshot(activeDocRef, (snap) => {
      setLoading(false)
      if (snap.exists()) {
        const data = snap.data()
        if (data && data.status === 'active') {
          setActivePoll(data)
          setError(null)
          return
        }
      }
      setActivePoll(null)
    }, (err) => {
      console.error('Active poll listener error:', err)
      setError(t('errorLoad'))
      setLoading(false)
    })

    // 2. Escuchar el registro del usuario para actualizar su lista de votos en tiempo real
    const regDocRef = doc(db, 'registrations', initialReg.id)
    const unsubReg = onSnapshot(regDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setVotedPolls(data?.votedPolls || [])
      }
    })

    return () => {
      unsubActive()
      unsubReg()
    }
  }, [initialReg.id])

  async function handleSubmitVote() {
    if (!selectedOption || !activePoll) return
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`${API_URL}/polls/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ optionId: selectedOption }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('errorSubmit'))

      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorConnection') || 'Error de conexión. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasVotedActive = activePoll && votedPolls.includes(activePoll.proposalId)

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
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
        <span className="font-heading font-bold text-sm tracking-widest text-rose-400 uppercase">
          {t('liveTitle')}
        </span>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        
        {/* Sin votación activa */}
        {!activePoll && (
          <Card className="bg-white border border-border p-8 text-center rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse">
              <Vote className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-2">{t('panelTitle')}</h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
              {t('noActive')}
            </p>
          </Card>
        )}

        {/* Votación activa disponible */}
        {activePoll && (
          <div className="flex flex-col gap-6">
            
            {hasVotedActive ? (
              // YA VOTÓ EN ESTA PROPUESTA
              <Card className="bg-white border border-border p-8 text-center rounded-2xl shadow-sm relative overflow-hidden">
                <div className="h-[4px] bg-emerald-500 absolute top-0 left-0 right-0" />
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-heading font-bold text-text-primary mb-2">{t('voteReceived')}</h2>
                <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto mb-4">
                  {t('voteSuccessText', { title: activePoll.title })}
                </p>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  {t('waitingResults')}
                </span>
              </Card>
            ) : (
              // FORMULARIO DE VOTACIÓN
              <Card className="bg-white border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="h-[4px] bg-rose-500 absolute top-0 left-0 right-0" />
                
                <div className="flex items-center gap-3 mb-5 border-b border-border pb-4">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <Vote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block">{t('activeProposal')}</span>
                    <h2 className="text-base font-heading font-bold text-text-primary leading-tight mt-0.5">{activePoll.title}</h2>
                  </div>
                </div>

                {activePoll.description && (
                  <p className="text-xs text-text-secondary leading-relaxed mb-6 bg-gray-50 p-3.5 rounded-xl border border-border">
                    {activePoll.description}
                  </p>
                )}

                <div className="flex flex-col gap-3 mb-6">
                  {activePoll.options.map((opt: any) => {
                    const isSelected = selectedOption === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOption(opt.id)}
                        className={clsx(
                          'w-full p-4 border-2 rounded-xl text-left text-sm font-semibold transition-all duration-150',
                          isSelected 
                            ? 'border-rose-500 bg-rose-50/10 text-rose-700 ring-1 ring-rose-500/20' 
                            : 'border-border bg-white text-text-primary hover:border-gray-400'
                        )}
                      >
                        {opt.text}
                      </button>
                    )
                  })}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex gap-2 items-start mb-4">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  disabled={!selectedOption || isSubmitting}
                  onClick={handleSubmitVote}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('submitBtn')}
                </Button>
              </Card>
            )}
            
          </div>
        )}
      </main>
    </div>
  )
}
