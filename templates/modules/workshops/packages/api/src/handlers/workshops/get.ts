import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { getFeatureFlags } from '../../lib/features'
import { ok, forbidden, serverError } from '../../lib/response'
import type { Registration } from '@plenarias/shared'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // 1. Verificar autenticación del registrante (Token en cabecera)
  const reg = await verifyRegistrantToken(event)
  if (!reg) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado o token expirado' }) }
  }

  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.workshopsEnabled) {
      return forbidden('La seleccion de talleres esta deshabilitada temporalmente.')
    }

    // 2. Obtener configuración global del evento
    const configSnap = await db.collection('config').doc('global').get()
    const config = configSnap.data()
    const standardPrice = config?.standardPrice ?? 0

    // 3. Determinar si ya seleccionó talleres
    const hasSelectedStudios = Array.isArray(reg.selectedWorkshops) && reg.selectedWorkshops.length > 0

    // 4. Determinar si puede seleccionar (ej: requiere pago aprobado y balance en 0)
    // Para simplificar, consideramos canSelect = (status !== 'pending_payment' && status !== 'payment_submitted')
    const pendingBalance = reg.status === 'pending_payment' || reg.status === 'payment_submitted' ? standardPrice : 0
    const canSelectStudios = pendingBalance === 0 && !hasSelectedStudios

    // 5. Obtener talleres de Firestore
    const workshopsSnap = await db.collection('workshops').get()
    const workshopsList: any[] = []
    
    workshopsSnap.forEach((doc) => {
      const data = doc.data()
      workshopsList.push({
        id: doc.id,
        name: data.title || data.name,
        description: data.description || '',
        speaker: data.speaker || '',
        date: data.date, // Formato YYYY-MM-DD
        place: data.place || '',
        capacity: data.capacity ?? 0,
        currentAssistants: data.enrolledCount ?? 0,
        genderRestriction: data.genderRestriction || null,
        counselorsOnly: data.counselorsOnly || false,
      })
    });

    // 6. Agrupar talleres por día (martes, miercoles, jueves) para el frontend
    const groupedWorkshops: { martes: any[]; miercoles: any[]; jueves: any[] } = {
      martes: [],
      miercoles: [],
      jueves: [],
    }

    for (const workshop of workshopsList) {
      const dateStr = workshop.date // YYYY-MM-DD
      if (!dateStr) continue

      const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay() // Evitar desfase por timezone
      if (dayOfWeek === 2) {
        groupedWorkshops.martes.push(workshop)
      } else if (dayOfWeek === 3) {
        groupedWorkshops.miercoles.push(workshop)
      } else if (dayOfWeek === 4) {
        groupedWorkshops.jueves.push(workshop)
      }
    }

    return ok({
      hasSelectedStudios,
      canSelectStudios,
      pendingBalance,
      packageCost: standardPrice,
      studios: groupedWorkshops,
    })
  } catch (err) {
    console.error('get-workshops error:', err)
    return serverError()
  }
}
