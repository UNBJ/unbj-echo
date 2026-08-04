import { notFound } from 'next/navigation'
import { getRegistration } from '@/lib/api'
import { WorkshopsSelector } from './WorkshopsSelector'

interface Props {
  params: Promise<{ token: string }>
}

export default async function WorkshopsPage({ params }: Props) {
  const { token } = await params

  let registration
  try {
    registration = await getRegistration(token)
  } catch {
    notFound()
  }

  return (
    <WorkshopsSelector 
      registration={registration} 
      token={token} 
      locale="es" 
    />
  )
}
