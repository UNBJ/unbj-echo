import { notFound } from 'next/navigation'
import { getRegistration } from '@/lib/api'
import { RoomManager } from './RoomManager'

interface Props {
  params: Promise<{ token: string }>
}

export default async function RoomsPage({ params }: Props) {
  const { token } = await params

  let registration
  try {
    registration = await getRegistration(token)
  } catch {
    notFound()
  }

  return (
    <RoomManager 
      registration={registration} 
      token={token} 
    />
  )
}
