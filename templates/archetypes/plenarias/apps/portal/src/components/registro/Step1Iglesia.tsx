'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Check, ChevronDown, X } from 'lucide-react'
import { getConventions, searchChurches } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Convention, Church } from '@unbj/shared'

export interface ChurchSelection {
  convention: Convention | null
  conventionNotListed: boolean
  conventionNotListedName: string
  church: Church | null
  churchNotListed: boolean
  churchNotListedName: string
}

interface Step1IglesiaProps {
  selected: ChurchSelection | null
  onNext: (selection: ChurchSelection) => void
}

const inputClasses = 'w-full px-3 py-2.5 border border-border rounded-lg bg-bg-card text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150'

export function Step1Iglesia({ selected, onNext }: Step1IglesiaProps) {
  const [conventions, setConventions] = useState<Convention[]>([])
  const [convQuery, setConvQuery] = useState('')
  const [convOpen, setConvOpen] = useState(false)
  const [selectedConvention, setSelectedConvention] = useState<Convention | null>(
    selected?.convention ?? null
  )
  const [conventionNotListed, setConventionNotListed] = useState(selected?.conventionNotListed ?? false)
  const [conventionNotListedName, setConventionNotListedName] = useState(selected?.conventionNotListedName ?? '')

  const [churchQuery, setChurchQuery] = useState('')
  const [churchResults, setChurchResults] = useState<Church[]>([])
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(selected?.church ?? null)
  const [churchNotListed, setChurchNotListed] = useState(selected?.churchNotListed ?? false)
  const [churchNotListedName, setChurchNotListedName] = useState(selected?.churchNotListedName ?? '')
  const [churchLoading, setChurchLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const convDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getConventions().then(setConventions).catch(() => {})
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (convDropdownRef.current && !convDropdownRef.current.contains(e.target as Node)) {
        setConvOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filteredConventions = convQuery.length >= 1
    ? conventions.filter((c) => c.name.toLowerCase().includes(convQuery.toLowerCase()))
    : conventions

  function handleSelectConvention(conv: Convention) {
    setSelectedConvention(conv)
    setConvOpen(false)
    setConvQuery('')
    setSelectedChurch(null)
    setChurchQuery('')
    setChurchResults([])
    setChurchNotListed(false)
    setChurchNotListedName('')
  }

  function handleConventionNotListed(checked: boolean) {
    setConventionNotListed(checked)
    if (checked) {
      setSelectedConvention(null)
      setConvQuery('')
      setConvOpen(false)
      setSelectedChurch(null)
      setChurchQuery('')
      setChurchResults([])
      setChurchNotListed(false)
      setChurchNotListedName('')
    } else {
      setConventionNotListedName('')
    }
  }

  function handleChurchSearch(value: string) {
    setChurchQuery(value)
    setSelectedChurch(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!selectedConvention || value.length < 2) {
      setChurchResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setChurchLoading(true)
      try {
        const res = await searchChurches({ conventionId: selectedConvention.id, query: value })
        setChurchResults(res.churches)
      } catch {
        setChurchResults([])
      } finally {
        setChurchLoading(false)
      }
    }, 400)
  }

  function handleChurchNotListed(checked: boolean) {
    setChurchNotListed(checked)
    if (checked) {
      setSelectedChurch(null)
      setChurchQuery('')
      setChurchResults([])
    } else {
      setChurchNotListedName('')
    }
  }

  const conventionReady = conventionNotListed
    ? conventionNotListedName.trim().length >= 2
    : selectedConvention !== null

  const churchReady = conventionNotListed
    ? churchNotListedName.trim().length >= 2
    : churchNotListed
      ? churchNotListedName.trim().length >= 2
      : selectedChurch !== null

  const canContinue = conventionReady && churchReady

  function handleNext() {
    if (!canContinue) return
    onNext({
      convention: selectedConvention,
      conventionNotListed,
      conventionNotListedName: conventionNotListed ? conventionNotListedName.trim() : '',
      church: selectedChurch,
      churchNotListed: conventionNotListed || churchNotListed,
      churchNotListedName: (conventionNotListed || churchNotListed) ? churchNotListedName.trim() : '',
    })
  }

  return (
    <Card accent>
      <h2 className="text-xl font-heading font-semibold tracking-tight text-text-primary mb-1">Iglesia de procedencia</h2>
      <p className="text-sm text-text-secondary mb-6">
        Selecciona primero tu convención regional y luego busca tu iglesia.
      </p>

      {/* ── FASE A: Convención ── */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Convención Regional
        </label>

        {!conventionNotListed && (
          <div className="relative" ref={convDropdownRef}>
            <button
              type="button"
              onClick={() => setConvOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-lg bg-bg-card text-sm text-left focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150"
            >
              <span className={selectedConvention ? 'text-text-primary' : 'text-text-secondary'}>
                {selectedConvention ? selectedConvention.name : 'Selecciona tu convención...'}
              </span>
              <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
            </button>

            {convOpen && (
              <div className="absolute z-20 mt-1 w-full bg-bg-card border border-border rounded-lg shadow-pop max-h-72 flex flex-col animate-fade-in">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                    <input
                      autoFocus
                      type="text"
                      value={convQuery}
                      onChange={(e) => setConvQuery(e.target.value)}
                      placeholder="Buscar convención..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-card border border-border rounded-md focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150"
                    />
                  </div>
                </div>
                <ul className="overflow-y-auto">
                  {filteredConventions.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-text-secondary">Sin resultados</li>
                  ) : (
                    filteredConventions.map((conv) => (
                      <li key={conv.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectConvention(conv)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-bg-subtle transition-colors"
                        >
                          <span className="text-text-primary">{conv.name}</span>
                          {conv.code && (
                            <span className="ml-2 text-xs text-text-secondary font-mono">{conv.code}</span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {selectedConvention && !conventionNotListed && (
          <div className="flex items-center gap-2 mt-2 p-2.5 bg-success/10 border border-success/20 rounded-lg animate-fade-in">
            <Check className="w-4 h-4 text-success flex-shrink-0" />
            <span className="text-sm text-text-primary flex-1">{selectedConvention.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedConvention(null)
                setSelectedChurch(null)
                setChurchResults([])
                setChurchNotListed(false)
                setChurchNotListedName('')
              }}
              className="text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={conventionNotListed}
            onChange={(e) => handleConventionNotListed(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          <span className="text-sm text-text-secondary">Mi convención no está listada</span>
        </label>

        {conventionNotListed && (
          <div className="mt-3 flex flex-col gap-3">
            <input
              type="text"
              value={conventionNotListedName}
              onChange={(e) => setConventionNotListedName(e.target.value)}
              placeholder="Escribe el nombre de tu convención"
              className={inputClasses}
            />
            <input
              type="text"
              value={churchNotListedName}
              onChange={(e) => setChurchNotListedName(e.target.value)}
              placeholder="Escribe el nombre de tu iglesia"
              className={inputClasses}
            />
          </div>
        )}
      </div>

      {/* ── FASE B: Iglesia (solo si la convención está listada) ── */}
      {selectedConvention && !conventionNotListed && (
        <div className="border-t border-border pt-5">
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Iglesia
          </label>

          {!churchNotListed && (
            <>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={churchQuery}
                  onChange={(e) => handleChurchSearch(e.target.value)}
                  placeholder="Busca tu iglesia en esta convención..."
                  className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-bg-card text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all duration-150"
                />
              </div>

              {churchLoading && (
                <p className="text-sm text-text-secondary text-center py-2">Buscando...</p>
              )}

              {!churchLoading && churchResults.length > 0 && !selectedChurch && (
                <ul className="border border-border rounded-lg divide-y divide-border mb-3 max-h-56 overflow-y-auto animate-fade-in">
                  {churchResults.map((church) => (
                    <li key={church.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChurch(church)
                          setChurchResults([])
                          setChurchQuery(church.name)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-bg-subtle transition-colors"
                      >
                        <p className="text-sm font-medium text-text-primary">{church.name}</p>
                        {church.code && (
                          <p className="text-xs text-text-secondary font-mono">{church.code}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedChurch && (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-success/10 border border-success/20 rounded-lg animate-fade-in">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="text-sm text-text-primary flex-1">{selectedChurch.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedChurch(null); setChurchQuery(''); setChurchResults([]) }}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={churchNotListed}
              onChange={(e) => handleChurchNotListed(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-text-secondary">Mi iglesia no está listada</span>
          </label>

          {churchNotListed && (
            <div className="mt-3">
              <input
                type="text"
                value={churchNotListedName}
                onChange={(e) => setChurchNotListedName(e.target.value)}
                placeholder="Escribe el nombre de tu iglesia"
                className={inputClasses}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={handleNext} disabled={!canContinue}>
          Continuar
        </Button>
      </div>
    </Card>
  )
}
