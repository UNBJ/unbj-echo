'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { checkIn, type CheckInResult } from '@/lib/api'
import { DELEGATE_LABELS } from '@/lib/labels'
import { QrScanner } from '@/components/admin/QrScanner'
import { CheckCircle2, XCircle, AlertCircle, Scan, Keyboard } from 'lucide-react'

type ScanResult = CheckInResult & { timestamp: number }

export default function CheckInPage() {
  const { getToken } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [showManual, setShowManual] = useState(false)
  const processingRef = useRef(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const processToken = useCallback(async (qrToken: string) => {
    if (processingRef.current) return
    processingRef.current = true
    setLoading(true)

    try {
      const token = await getToken()
      const res = await checkIn(token, qrToken)
      setResult({ ...res, timestamp: Date.now() })
      setScanning(false)

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(() => {
        setResult(null)
        processingRef.current = false
        setScanning(true)
      }, 4000)
    } catch {
      setResult({ status: 'invalid', timestamp: Date.now() })
      processingRef.current = false
    } finally {
      setLoading(false)
    }
  }, [getToken])

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualToken.trim()) return
    await processToken(manualToken.trim())
    setManualToken('')
  }

  function handleReset() {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    setResult(null)
    processingRef.current = false
    setScanning(true)
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-heading font-semibold tracking-tight text-text-primary">Check-in por QR</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Escanea el código QR del nombramiento impreso
        </p>
      </div>

      {/* Result overlay */}
      {result && (
        <ResultCard result={result} onReset={handleReset} />
      )}

      {/* Scanner */}
      {!result && (
        <div className="flex flex-col gap-4">
          {scanning ? (
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <QrScanner onScan={processToken} active={scanning && !loading} />
              {loading && (
                <p className="text-center text-sm text-text-secondary mt-3 animate-pulse">
                  Verificando...
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setScanning(true); processingRef.current = false }}
              className="flex flex-col items-center justify-center gap-3 w-full h-48 bg-bg-card border-2 border-dashed border-border rounded-xl hover:border-accent hover:bg-accent/10 transition-colors"
            >
              <Scan className="w-10 h-10 text-text-secondary" />
              <span className="text-sm font-medium text-text-secondary">
                Toca para iniciar el escáner
              </span>
            </button>
          )}

          {/* Manual input toggle */}
          <button
            onClick={() => setShowManual((v) => !v)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mx-auto"
          >
            <Keyboard className="w-4 h-4" />
            {showManual ? 'Ocultar entrada manual' : 'Ingresar token manualmente'}
          </button>

          {showManual && (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="UUID del token QR..."
                className="flex-1 border border-border rounded-lg bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150"
              />
              <button
                type="submit"
                disabled={loading || !manualToken.trim()}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              >
                Verificar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function ResultCard({ result, onReset }: { result: ScanResult; onReset: () => void }) {
  const isValid = result.status === 'valid'
  const isAlready = result.status === 'already_scanned'
  const isInvalid = result.status === 'invalid'

  const config = {
    valid: {
      bg: 'bg-success/10 border-success/40',
      icon: <CheckCircle2 className="w-10 h-10 text-success" />,
      title: '¡Check-in registrado!',
      titleColor: 'text-success',
    },
    already_scanned: {
      bg: 'bg-warning/10 border-warning/40',
      icon: <AlertCircle className="w-10 h-10 text-warning" />,
      title: 'Ya registrado anteriormente',
      titleColor: 'text-warning',
    },
    invalid: {
      bg: 'bg-error/10 border-error/40',
      icon: <XCircle className="w-10 h-10 text-error" />,
      title: 'QR inválido o no aprobado',
      titleColor: 'text-error',
    },
    offline: {
      bg: 'bg-bg-subtle border-border',
      icon: <XCircle className="w-10 h-10 text-text-secondary" />,
      title: 'Sin conexión',
      titleColor: 'text-text-primary',
    },
  }[result.status]

  const reg = result.registration

  return (
    <div className={`border-2 rounded-xl p-6 flex flex-col items-center gap-4 text-center ${config.bg}`}>
      {config.icon}
      <p className={`text-lg font-heading font-semibold tracking-tight ${config.titleColor}`}>{config.title}</p>

      {reg && (
        <div className="w-full bg-bg-card/70 rounded-lg p-4 flex flex-col gap-1 text-left">
          <p className="font-semibold text-text-primary text-base">{reg.fullName}</p>
          <p className="text-sm text-text-secondary">{reg.churchName}</p>
          <p className="text-xs font-medium mt-1 text-text-secondary">
            {reg.delegateType ? DELEGATE_LABELS[reg.delegateType] : 'Sin asignar'}
          </p>
          {isAlready && reg.checkedInAt && (
            <p className="text-xs text-warning mt-1">
              Registrado el {new Date(reg.checkedInAt).toLocaleString('es-MX')}
              {reg.checkedInBy && ` por ${reg.checkedInBy}`}
            </p>
          )}
        </div>
      )}

      {isInvalid && (
        <p className="text-sm text-error">
          El código QR no corresponde a un registro aprobado.
        </p>
      )}

      <button
        onClick={onReset}
        className="mt-2 px-6 py-2 bg-bg-card border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-bg-subtle transition-colors"
      >
        Escanear siguiente
      </button>

      <p className="text-xs text-text-secondary">
        Se reiniciará automáticamente en 4 s
      </p>
    </div>
  )
}
