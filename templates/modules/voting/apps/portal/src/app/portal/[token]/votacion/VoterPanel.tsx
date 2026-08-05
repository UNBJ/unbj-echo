'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Vote, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'
import { useTranslations } from '@/hooks/useTranslations'

interface VoterPanelProps {
  registration: any
  token: string
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export function VoterPanel({ registration: _initialReg, token }: VoterPanelProps) {
  const router = useRouter()
  const t = useTranslations('voting')

  const [activePoll, setActivePoll] = useState<any>(null)
  const [hasVotedActive, setHasVotedActive] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const results = activePoll?.results || {}
  const totalVotes = Object.values(results).reduce((sum: number, value: any) => sum + value, 0) as number

  async function fetchVotingState() {
    try {
      const res = await fetch(`${API_URL}/polls/active`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('errorLoad'))

      setActivePoll(data.activePoll ?? null)
      setHasVotedActive(Boolean(data.hasVoted))
      setError(null)
    } catch (err: any) {
      console.error('Fetch active poll error:', err)
      setError(err.message || t('errorLoad'))
      setActivePoll(null)
      setHasVotedActive(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchVotingState()

    const intervalId = window.setInterval(() => {
      void fetchVotingState()
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [token])

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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ optionId: selectedOption }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('errorSubmit'))

      setSuccess(true)
      setSelectedOption('')
      await fetchVotingState()
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorConnection') || 'Error de conexión. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
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
    <div className="min-h-screen bg-bg-page flex flex-col">
      <header className="bg-bg-sidebar text-text-on-dark h-16 px-6 md:px-12 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => router.push(`/portal/${token}`)}
          className="flex items-center gap-2 text-text-on-dark/70 hover:text-text-on-dark transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backBtn')}</span>
        </button>
        <span className="font-heading font-bold text-sm tracking-widest text-accent uppercase">
          {t('liveTitle')}
        </span>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {!activePoll && (
          <Card className="bg-bg-card border border-border p-8 text-center rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse">
              <Vote className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-2">{t('panelTitle')}</h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
              {t('noActive')}
            </p>
          </Card>
        )}

        {activePoll && (
          <div className="flex flex-col gap-6">
            {hasVotedActive ? (
              <Card className="bg-bg-card border border-border p-8 text-center rounded-2xl shadow-sm relative overflow-hidden">
                <div className="h-[4px] bg-emerald-500 absolute top-0 left-0 right-0" />
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-heading font-bold text-text-primary mb-2">{t('voteReceived')}</h2>
                <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto mb-4">
                  {t('voteSuccessText', { title: activePoll.title })}
                </p>

                <div className="mt-6 border-t border-border pt-5 text-left">
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                      Resultados en tiempo real
                    </span>
                    <span className="text-[11px] font-semibold text-text-secondary">
                      {totalVotes} {totalVotes === 1 ? 'voto total' : 'votos totales'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {activePoll.options.map((opt: any) => {
                      const votes = results[opt.id] ?? 0
                      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

                      return (
                        <div key={opt.id} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold text-text-primary gap-3">
                            <span>{opt.text}</span>
                            <span className="text-text-secondary">
                              {votes} {votes === 1 ? 'voto' : 'votos'} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-3 bg-bg-page rounded-full overflow-hidden border border-border">
                            <div
                              className="h-full bg-accent rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="h-[4px] bg-accent absolute top-0 left-0 right-0" />

                <div className="flex items-center gap-3 mb-5 border-b border-border pb-4">
                  <div className="p-2 bg-accent/10 text-accent rounded-lg">
                    <Vote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest block">{t('activeProposal')}</span>
                    <h2 className="text-base font-heading font-bold text-text-primary leading-tight mt-0.5">{activePoll.title}</h2>
                  </div>
                </div>

                {activePoll.description && (
                  <p className="text-xs text-text-secondary leading-relaxed mb-6 bg-bg-page p-3.5 rounded-xl border border-border">
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
                            ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent/20'
                            : 'border-border bg-bg-card text-text-primary hover:border-accent/50'
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
                  className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
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
