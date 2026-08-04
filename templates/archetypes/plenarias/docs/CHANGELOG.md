# Changelog

## [Unreleased] — 2026-06-01

### Listado real de iglesias con Convenciones Regionales (`@listado-iglesias`)

**Fuente de datos**
- Se reemplazó la API corporativa externa por un listado estático generado a partir del Excel oficial `LISTADO DE IGLESIAS.xlsx`.
- Nuevo script `scripts/parse-churches.py` que parsea el Excel y genera `packages/api/src/data/churches-data.ts` con 69 convenciones y 1,730 iglesias.
- Iglesias sin código en la columna D del Excel se incluyen con `code: null`.
- Las variables de entorno `CORPORATE_DB_API_URL` y `CORPORATE_DB_API_KEY` fueron eliminadas.

**API**
- Nuevo endpoint `GET /conventions` — devuelve el listado de convenciones regionales.
- `POST /churches/search` reescrito — ya no hace proxy a API externa; filtra el listado estático por `conventionId` y `query`.
- `POST /registrations` actualizado para almacenar `conventionId`, `conventionName`, `conventionCode`, `churchCode`.

**Portal — formulario de pre-registro**
- El Step 1 ("Iglesia") ahora tiene dos fases: primero se elige la Convención Regional, luego se busca la iglesia dentro de esa convención.
- Si el usuario marca "Mi convención no está listada" o "Mi iglesia no está listada", se muestra un mensaje indicando que debe comunicarse con Tesorería (con números de teléfono de contacto). El botón Continuar se deshabilita — no se puede registrar en ese caso.
- Step 3 renombrado de "Confirma tu registro" a "Confirma tu pre-registro".

**Tipos compartidos**
- Nuevo tipo `Convention { id, name, code }`.
- Tipo `Church` actualizado: agrega `code: string | null` y `conventionId`; se eliminó `state`.
- `Registration` agrega `conventionId`, `conventionName`, `conventionCode`, `churchCode`.
- Se eliminó el campo `convention: string` (reemplazado por `conventionName`).

**Admin**
- Vista de detalle de asistente actualizada: muestra convención con su código y la iglesia con su código (o "Sin código" si no aplica).

### Módulo de pagos deshabilitado temporalmente

**Portal — portal personal**
- Cuando el status del registro es `pending_payment`, ya no se muestra el formulario de Stripe. En su lugar aparece un card informativo: _"Pago próximamente disponible — Estén pendientes a su correo"_.
- El componente `PendingPaymentBlock` y el import de `StripePaymentForm` fueron removidos de `ActionBlock.tsx`. El componente `StripePaymentForm.tsx` se conserva para su reactivación futura.
- El `ProgressTracker` y los demás estados del portal no cambian.
