import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { ok, badRequest, notFound, serverError } from '../../lib/response'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // 1. Verificar autenticación del registrante
  const reg = await verifyRegistrantToken(event)
  if (!reg) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado o token expirado' }) }
  }

  const db = getDb()

  try {
    const selectedIds = reg.selectedWorkshops || []

    if (selectedIds.length === 0) {
      return ok({
        hasSelectedStudios: false,
        selectedStudios: [],
      })
    }

    // 2. Obtener los detalles de los talleres de Firestore
    const selectedStudios: any[] = []
    
    // Firestore no soporta "in" vacío
    if (selectedIds.length > 0) {
      const workshopsSnap = await db.collection('workshops')
        .where('__name__', 'in', selectedIds)
        .get()

      workshopsSnap.forEach((doc) => {
        const data = doc.data()
        
        // Determinar nombre del día de la semana
        const dateStr = data.date
        let dayName = ''
        if (dateStr) {
          const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()
          if (dayOfWeek === 2) dayName = 'Martes'
          else if (dayOfWeek === 3) dayName = 'Miércoles'
          else if (dayOfWeek === 4) dayName = 'Jueves'
        }

        selectedStudios.push({
          id: doc.id,
          name: data.title || data.name,
          description: data.description || '',
          speaker: data.speaker || '',
          date: data.date,
          day: dayName,
          place: data.place || '',
        })
      });
    }

    // Ordenar por fecha del taller
    selectedStudios.sort((a, b) => a.date.localeCompare(b.date))

    return ok({
      hasSelectedStudios: true,
      selectedStudios,
    })
  } catch (err) {
    console.error('get-my-workshops error:', err)
    return serverError()
  }
}
