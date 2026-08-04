import { notFound } from 'next/navigation'
import { getRegistration } from '@/lib/api'
import { VoterPanel } from './VoterPanel'

interface Props {
  params: Promise<{ token: string }>
}

export default async function VotingPage({ params }: Props) {
  const { token } = await params

  let registration
  try {
    registration = await getRegistration(token)
  } catch {
    notFound()
  }

  return (
    <VoterPanel 
      registration={registration} 
      token={token} 
    />
  )
}
