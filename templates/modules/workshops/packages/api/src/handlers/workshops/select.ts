import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { getFeatureFlags } from '../../lib/features'
import { ok, badRequest, forbidden, serverError } from '../../lib/response'
import * as admin from 'firebase-admin'

const schema = z.object({
  studioIds: z.array(z.string()).min(1),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // 1. Verificar autenticación del registrante
  const reg = await verifyRegistrantToken(event)
  if (!reg) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado o token expirado' }) }
  }

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
  }

  const { studioIds } = parsed.data
  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.workshopsEnabled) {
      return forbidden('La seleccion de talleres esta deshabilitada temporalmente.')
    }

    // 2. Ejecutar transacción de Firestore para consistencia atómica
    const result = await db.runTransaction(async (transaction) => {
      // 2a. Re-obtener el registro dentro de la transacción
      const regRef = db.collection('registrations').doc(reg.id)
      const regDoc = await transaction.get(regRef)
      if (!regDoc.exists) {
        throw new Error('Registro no encontrado')
      }
      
      const currentReg = regDoc.data() as any
      
      // 2b. Validar que no haya seleccionado previamente
      if (Array.isArray(currentReg.selectedWorkshops) && currentReg.selectedWorkshops.length > 0) {
        throw new Error('Ya has seleccionado tus talleres. Esta acción no puede deshacerse.')
      }

      // 2c. Validar saldo pendiente (el registro debe estar aprobado o totalmente aprobado)
      const allowedStatuses = ['payment_approved', 'fully_approved', 'checked_in']
      if (!allowedStatuses.includes(currentReg.status)) {
        throw new Error('Debes completar el pago de tu paquete antes de seleccionar talleres')
      }

      // 2d. Obtener y bloquear documentos de talleres seleccionados
      const uniqueIds = [...new Set(studioIds)]
      const workshopRefs = uniqueIds.map(id => db.collection('workshops').doc(id))
      const workshopDocs = await Promise.all(workshopRefs.map(ref => transaction.get(ref)))

      // Validar que todos los IDs existan
      if (workshopDocs.some(doc => !doc.exists)) {
        throw new Error('Algunos talleres seleccionados no existen o no están disponibles')
      }

      const workshopsData = workshopDocs.map(doc => ({ id: doc.id, ...doc.data() as any }))

      // 2e. Validar distribución de días y cupo
      // Validar que haya exactamente un taller por día (Martes, Miércoles, Jueves)
      const daysCount: Record<string, number> = {}
      for (const ws of workshopsData) {
        const dateStr = ws.date
        if (!dateStr) throw new Error(`El taller "${ws.title || ws.name}" no tiene fecha configurada`)
        
        const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()
        let dayName = ''
        if (dayOfWeek === 2) dayName = 'martes'
        else if (dayOfWeek === 3) dayName = 'miercoles'
        else if (dayOfWeek === 4) dayName = 'jueves'
        else throw new Error(`Fecha de taller inválida para "${ws.title || ws.name}"`)
        
        daysCount[dayName] = (daysCount[dayName] || 0) + 1
      }

      const expectedDays = ['martes', 'miercoles', 'jueves']
      for (const day of expectedDays) {
        if (!daysCount[day] || daysCount[day] !== 1) {
          throw new Error('Debes seleccionar exactamente un taller para cada día (Martes, Miércoles, Jueves)')
        }
      }

      // 2f. Validar capacidad en cada taller
      for (const ws of workshopsData) {
        const capacity = ws.capacity ?? 0
        const enrolled = ws.enrolledCount ?? 0
        if (enrolled + 1 > capacity) {
          throw new Error(`El taller "${ws.title || ws.name}" no tiene capacidad suficiente. Espacios disponibles: ${capacity - enrolled}`)
        }
      }

      // 3. Modificaciones físicas: Incrementar contadores y asignar al registrante
      workshopRefs.forEach(ref => {
        transaction.update(ref, {
          enrolledCount: admin.firestore.FieldValue.increment(1)
        })
      });

      transaction.update(regRef, {
        selectedWorkshops: uniqueIds,
        workshopsSelectedAt: new Date().toISOString()
      });

      return { success: true }
    });

    return ok(result)
  } catch (err: any) {
    console.error('Select workshops transaction error:', err)
    return badRequest(err.message || 'Error al inscribir en los talleres')
  }
}
