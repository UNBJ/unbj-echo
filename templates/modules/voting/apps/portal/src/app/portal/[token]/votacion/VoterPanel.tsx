'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Vote, CheckCircle2, Loader2, AlertCircle, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'
import { useTranslations } from '@/hooks/useTranslations'

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

  async function fetchVotingState() {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      const [activeRes, closedRes] = await Promise.all([
        fetch(`${API_URL}/polls/active`, { headers, cache: 'no-store' }),
        fetch(`${API_URL}/polls/closed`, { headers, cache: 'no-store' }),
      ])
      const [activeData, closedData] = await Promise.all([activeRes.json(), closedRes.json()])
      if (!activeRes.ok) throw new Error(activeData.error ?? t('errorLoad'))
      if (!closedRes.ok) throw new Error(closedData.error ?? t('errorLoad'))

      setActivePoll(activeData.activePoll ?? null)
      setHasVotedActive(Boolean(activeData.hasVoted))
      setClosedPolls(closedData.polls ?? [])
      setError(null)
    } catch (err: any) {
      console.error('Fetch active poll error:', err)
      setError(err.message || t('errorLoad'))
      setActivePoll(null)
      setHasVotedActive(false)
      setClosedPolls([])
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
        <div className="flex flex-col gap-6">
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
            hasVotedActive ? (
              <Card className="bg-bg-card border border-border p-8 text-center rounded-2xl shadow-sm relative overflow-hidden">
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
            ))}

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <Trophy className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-heading font-bold text-text-primary">{t('closedResultsTitle')}</h2>
            </div>

            {closedPolls.length === 0 ? (
              <Card className="bg-bg-card border border-border p-5 rounded-2xl text-center text-sm text-text-secondary">
                {t('closedResultsEmpty')}
              </Card>
            ) : (
              closedPolls.map((poll) => {
                const maxVotes = Math.max(...poll.options.map((option) => poll.results[option.id] ?? 0), 0)
                const winnerIds = maxVotes > 0
                  ? poll.options.filter((option) => (poll.results[option.id] ?? 0) === maxVotes).map((option) => option.id)
                  : []
                const closedDate = poll.closedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(poll.closedAt)) : ''

                return (
                  <Card key={poll.proposalId} className="bg-bg-card border border-border p-5 rounded-2xl shadow-sm">
                    <div className="flex flex-col gap-1 border-b border-border pb-4 mb-4">
                      <h3 className="font-heading font-bold text-text-primary">{poll.title}</h3>
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
                            <div className="w-full h-3 bg-bg-page rounded-full overflow-hidden border border-border">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            {isWinner && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
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
    </div>
  )
}
