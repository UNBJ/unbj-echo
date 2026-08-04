'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shirt, Check, AlertCircle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'


import { useTranslations } from 'next-intl'


const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as const

interface ShirtSizeSelectorProps {
  token: string
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export function ShirtSizeSelector({ token }: ShirtSizeSelectorProps) {
  
  const t = useTranslations('tshirt')
  

  const [canSelect, setCanSelect] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [userSelection, setUserSelection] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [token])

  async function fetchStatus() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/users/shirt-size/status`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('errorLoad'))
      
      setCanSelect(data.canSelect)
      setSelectedSize(data.shirtSize)
      if (data.shirtSize) {
        setUserSelection(data.shirtSize)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorConnection') || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!userSelection) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/users/shirt-size/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ shirtSize: userSelection }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('errorSelect'))
      
      setSelectedSize(userSelection)
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('errorSelect'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-text-secondary">{t('loading')}</span>
      </Card>
    )
  }

  // Si ya tiene seleccionado una talla
  if (selectedSize) {
    return (
      <Card className="bg-white border border-border rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Shirt className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading font-bold text-sm text-text-primary">{t('chosen')}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                {t('confirmed')}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              {t('selectionTextPre')}<strong className="text-text-primary text-sm">{selectedSize}</strong>{t('selectionTextPost')}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // Si no puede elegir aún (pago pendiente)
  if (!canSelect) {
    return (
      <Card className="bg-gray-50/50 border border-border rounded-xl p-5 opacity-75">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-gray-100 text-gray-500">
            <Shirt className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-sm text-text-primary mb-1">{t('title')}</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t('notAvailable')}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // Formulario interactivo
  return (
    <Card className="bg-white border border-border rounded-xl p-6 relative overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-blue-500/60 via-indigo-500/80 to-blue-500/60 absolute top-0 left-0 right-0" />
      
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
          <Shirt className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-sm text-text-primary">{t('title')}</h3>
          <p className="text-xs text-text-secondary">{t('subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setUserSelection(size)}
            className={clsx(
              'w-11 h-11 rounded-lg border-2 font-bold text-xs flex items-center justify-center transition-all',
              userSelection === size
                ? 'border-blue-600 bg-blue-50/10 text-blue-600 ring-1 ring-blue-600/30'
                : 'border-border bg-white text-text-secondary hover:border-gray-400 hover:text-text-primary'
            )}
          >
            {size}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex gap-2 items-start mb-4">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button
        disabled={!userSelection || submitting}
        onClick={handleSubmit}
        className="w-full text-xs font-semibold py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1.5"
      >
        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {t('confirmBtn')}
      </Button>
    </Card>
  )
}
