import { notFound } from 'next/navigation'
import { getRegistration } from '@/lib/api'
import { PortalView } from '@/components/portal/PortalView'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PortalPage({ params }: Props) {
  const { token } = await params

  let registration
  try {
    registration = await getRegistration(token)
  } catch {
    notFound()
  }

  return <PortalView registration={registration} />
}
