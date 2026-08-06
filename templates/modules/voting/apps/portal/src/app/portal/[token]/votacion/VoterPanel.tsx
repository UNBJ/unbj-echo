'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Vote, CheckCircle2, Loader2, AlertCircle, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FadeIn } from '@/components/ui/motion'
import { clsx } from 'clsx'
import { useTranslations } from '@/hooks/useTranslations'
import { portalAuth, db } from '@/lib/firebase'
import { signInWithCustomToken } from 'firebase/auth'
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'

interface VoterPanelProps {
  registration: any
  token: string
}

interface ClosedPoll {
  proposalId: string
  title: string
  description: string
  options: Array<{ id: string; text: string }>
  results: Record<string, number>
  totalVotes: number
  closedAt: string | null
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export function VoterPanel({ registration: _initialReg, token }: VoterPanelProps) {
  const router = useRouter()
  const t = useTranslations('voting')

  const [activePoll, setActivePoll] = useState<any>(null)
  const [closedPolls, setClosedPolls] = useState<ClosedPoll[]>([])
  const [hasVotedActive, setHasVotedActive] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribeActive: (() => void) | undefined
    let unsubscribeClosed: (() => void) | undefined

    async function connectRealtime() {
    try {
        const response = await fetch(`${API_URL}/registrations/session`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const session = await response.json()
        if (!response.ok) throw new Error(session.error ?? t('errorLoad'))

        await signInWithCustomToken(portalAuth, session.customToken)
        if (cancelled) return

        const votedPolls = new Set<string>(session.votedPolls ?? [])
        unsubscribeActive = onSnapshot(doc(db, 'portal_live', 'active'), (snapshot) => {
          const poll = snapshot.exists() ? snapshot.data() : null
          setActivePoll(poll)
          setHasVotedActive(Boolean(poll && votedPolls.has(poll.proposalId)))
          setLoading(false)
          setError(null)
        }, (listenerError) => {
          console.error('Active poll listener error:', listenerError)
          setError(t('errorLoad'))
          setLoading(false)
        })
        unsubscribeClosed = onSnapshot(
          query(collection(db, 'portal_results'), orderBy('closedAt', 'desc'), limit(50)),
          (snapshot) => {
            setClosedPolls(snapshot.docs.map((item) => item.data() as ClosedPoll))
          },
          (listenerError) => console.error('Closed results listener error:', listenerError)
        )
      } catch (err: any) {
        console.error('Voting realtime connection error:', err)
        if (!cancelled) {
          setError(err.message || t('errorLoad'))
          setLoading(false)
        }
      }
    }

    void connectRealtime()
    return () => {
      cancelled = true
      unsubscribeActive?.()
      unsubscribeClosed?.()
    }
  }, [token])

  async function handleSubmitVote() {
    if (!selectedOption || !activePoll) return

    setIsSubmitting(true)
    setError(null)

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

      setSelectedOption('')
      setHasVotedActive(true)
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
    <FadeIn className="min-h-screen bg-bg-page flex flex-col">
      <header className="sticky top-0 z-10 bg-bg-card/80 backdrop-blur border-b border-border h-16 px-6 md:px-12 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => router.push(`/portal/${token}`)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backBtn')}</span>
        </button>
        <span className="font-heading font-semibold text-sm tracking-widest text-accent uppercase">
          {t('liveTitle')}
        </span>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="flex flex-col gap-6">
          {!activePoll && (
            <Card className="text-center">
              <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse">
                <Vote className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-heading font-semibold text-text-primary mb-2">{t('panelTitle')}</h2>
              <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
                {t('noActive')}
              </p>
            </Card>
          )}

          {activePoll && (
            hasVotedActive ? (
              <Card className="text-center">
                <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-heading font-semibold text-text-primary mb-2">{t('voteReceived')}</h2>
                <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto mb-4">
                  {t('voteSuccessText', { title: activePoll.title })}
                </p>
                <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  {t('waitingResults')}
                </span>
              </Card>
            ) : (
              <Card accent>
                <div className="flex items-center gap-3 mb-5 border-b border-border pb-4">
                  <div className="p-2 bg-accent/10 text-accent rounded-lg">
                    <Vote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-widest block">{t('activeProposal')}</span>
                    <h2 className="text-base font-heading font-semibold text-text-primary leading-tight mt-0.5">{activePoll.title}</h2>
                  </div>
                </div>

                {activePoll.description && (
                  <p className="text-xs text-text-secondary leading-relaxed mb-6 bg-bg-subtle p-3.5 rounded-xl border border-border">
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
                  <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs flex gap-2 items-start mb-4">
                    <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  disabled={!selectedOption || isSubmitting}
                  onClick={handleSubmitVote}
                  className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('submitBtn')}
                </Button>
              </Card>
            ))}

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <Trophy className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-heading font-semibold text-text-primary">{t('closedResultsTitle')}</h2>
            </div>

            {closedPolls.length === 0 ? (
              <Card>
                <EmptyState icon={Trophy} title={t('closedResultsEmpty')} />
              </Card>
            ) : (
              closedPolls.map((poll) => {
                const maxVotes = Math.max(...poll.options.map((option) => poll.results[option.id] ?? 0), 0)
                const winnerIds = maxVotes > 0
                  ? poll.options.filter((option) => (poll.results[option.id] ?? 0) === maxVotes).map((option) => option.id)
                  : []
                const closedDate = poll.closedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(poll.closedAt)) : ''

                return (
                  <Card key={poll.proposalId}>
                    <div className="flex flex-col gap-1 border-b border-border pb-4 mb-4">
                      <h3 className="font-heading font-semibold text-text-primary">{poll.title}</h3>
                      {poll.description && <p className="text-xs text-text-secondary leading-relaxed">{poll.description}</p>}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-text-secondary mt-1">
                        {closedDate && <span>{t('closedAt', { date: closedDate })}</span>}
                        <span>{t('totalVotes', { count: poll.totalVotes })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {poll.options.map((option) => {
                        const votes = poll.results[option.id] ?? 0
                        const percentage = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0
                        const isWinner = winnerIds.includes(option.id)

                        return (
                          <div key={option.id} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-text-primary">
                              <span className="min-w-0">{option.text}</span>
                              <span className="whitespace-nowrap text-text-secondary">
                                {votes === 1 ? t('voteCount', { count: votes }) : t('voteCountPlural', { count: votes })} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full h-3 bg-bg-subtle rounded-full overflow-hidden border border-border">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            {isWinner && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                                {winnerIds.length > 1 ? t('tie') : t('winner')}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                )
              })
            )}
          </section>
        </div>
      </main>
    </FadeIn>
  )
}
