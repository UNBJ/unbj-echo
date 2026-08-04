
import { useMemo } from 'react'
import esMessages from '../../messages/es.json'

export function useTranslations(namespace: string) {
  return useMemo(() => {
    const messages = (esMessages as any)[namespace] || {}
    return (key: string, values?: Record<string, string | number>) => {
      let text = messages[key] || key
      if (values) {
        Object.entries(values).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, 'g'), String(v))
        })
      }
      return text
    }
  }, [namespace])
}

