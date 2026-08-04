'use client'

import { useEffect, useRef } from 'react'

interface QrScannerProps {
  onScan: (text: string) => void
  active: boolean
}

export function QrScanner({ onScan, active }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    let stopped = false

    async function startScanner() {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode')
      if (stopped || !containerRef.current) return

      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (text) => { onScan(text) },
          () => {} // ignore not-found frames
        )
      } catch (err) {
        console.error('QR scanner start error', err)
      }
    }

    startScanner()

    return () => {
      stopped = true
      scannerRef.current?.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [active, onScan])

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div id="qr-reader" ref={containerRef} className="w-full rounded-xl overflow-hidden" />
      <style>{`
        #qr-reader video { border-radius: 12px; }
        #qr-reader__scan_region { border-radius: 12px; }
        #qr-reader__dashboard { display: none !important; }
      `}</style>
    </div>
  )
}
