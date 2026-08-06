'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createPaymentIntent, getRegistration } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { branding } from '@unbj/shared'

const stripePromise = loadStripe(process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] ?? '')

interface StripePaymentFormProps {
  token: string
  fullName: string
  email: string
  onSuccess: () => void
  onOxxo: (voucherUrl: string) => void
}

export function StripePaymentForm({ token, fullName, email, onSuccess, onOxxo }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    createPaymentIntent(token)
      .then((res) => { setClientSecret(res.clientSecret); setAmount(res.amount) })
      .catch(() => setLoadError('No se pudo iniciar el pago. Intenta de nuevo.'))
  }, [token])

  if (loadError) {
    return <p className="text-sm text-error text-center py-4">{loadError}</p>
  }

  if (!clientSecret) {
    return <p className="text-sm text-text-secondary text-center py-4">Cargando formulario de pago...</p>
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: branding.accentColor, borderRadius: '10px' },
        },
        locale: 'es-419',
      }}
    >
      <PaymentForm token={token} amount={amount} fullName={fullName} email={email} onSuccess={onSuccess} onOxxo={onOxxo} />
    </Elements>
  )
}

async function pollUntilPaymentConfirmed(token: string, timeoutMs = 30000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2000))
    try {
      const reg = await getRegistration(token)
      if (reg.status !== 'pending_payment') return true
    } catch {
      // ignorar errores de red durante polling
    }
  }
  return false
}

function PaymentForm({
  token,
  amount,
  fullName,
  email,
  onSuccess,
  onOxxo,
}: {
  token: string
  amount: number
  fullName: string
  email: string
  onSuccess: () => void
  onOxxo: (voucherUrl: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOxxo, setIsOxxo] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
        payment_method_data: {
          billing_details: { name: fullName, email },
        },
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Ocurrió un error al procesar el pago.')
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'requires_action') {
      // OXXO: mostrar voucher
      const voucherUrl = (paymentIntent.next_action as { oxxo_display_details?: { hosted_voucher_url?: string } })
        ?.oxxo_display_details?.hosted_voucher_url ?? ''
      onOxxo(voucherUrl)
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      // Polling hasta que el webhook actualice Firestore
      setLoading(false)
      setPolling(true)
      const confirmed = await pollUntilPaymentConfirmed(token)
      setPolling(false)
      if (!confirmed) {
        setError('Stripe confirmo el pago, pero la plataforma no recibio la confirmacion final. Verifica que `stripe listen` siga activo y que `STRIPE_WEBHOOK_SECRET` coincida con la sesion actual.')
        return
      }
      onSuccess()
      return
    }

    setLoading(false)
    onSuccess()
  }

  const amountFormatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount / 100)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement
        onChange={(e) => setIsOxxo(e.value.type === 'oxxo')}
        options={{
          defaultValues: {
            billingDetails: { name: fullName, email },
          },
        }}
      />

      {isOxxo && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg px-4 py-3 text-sm">
          <p className="font-medium text-warning mb-1">Pago en OXXO</p>
          <p className="text-text-secondary">
            Al confirmar se generará un voucher válido por <strong className="text-text-primary">3 días</strong>. Una vez pagado en
            tienda, la confirmación puede tardar hasta <strong className="text-text-primary">3 días hábiles</strong> en reflejarse.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2 animate-fade-in">
          {error}
        </p>
      )}

      {polling && (
        <p className="text-sm text-text-secondary text-center py-1">
          Confirmando tu pago...
        </p>
      )}

      <Button type="submit" disabled={!stripe || loading || polling} loading={loading || polling} className="w-full">
        Pagar {amountFormatted}
      </Button>

    </form>
  )
}
