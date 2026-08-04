# Changelog — Registro Plenarias CNBM 2026

## 2026-06-03

### Cambio de flujo — Asignación manual de tipo de delegado
- El tipo de delegado (`mensajero_acreditado` / `fraternal`) ya no se asigna automáticamente al registrarse
- El admin lo asigna manualmente desde el detalle del registro (UI presente pero deshabilitada con tooltip "Próximamente")
- `delegateType` es `null` hasta ser asignado; todos los delegados suben carta sin distinción
- Nuevo endpoint: `PATCH /admin/registrations/{id}/delegate-type`
- El email de confirmación ya no menciona el tipo de delegado
- Portal oculta el badge de tipo cuando es `null`
- CSV de exportación y stats del admin muestran "Sin asignar" para registros sin tipo
- PDF de nombramiento muestra "Sin asignar" si el tipo no ha sido asignado al momento de aprobación

### Fix — Build Amplify + pnpm monorepo
- Agregado `node-linker=hoisted` a `.npmrc` raíz para generar archivos reales (sin symlinks)
- Corrige fallo de build donde Amplify no encontraba `node_modules/next`
- `amplify.yml` copia `node_modules/next` con `cp -rL` para dereferenciar cualquier symlink residual

### Fix — TypeScript: `null` como índice en `DELEGATE_LABELS`
- Corregidos 4 archivos del admin y portal donde `DELEGATE_LABELS[reg.delegateType]` fallaba con `delegateType: null`
- Todos reemplazados por `reg.delegateType ? DELEGATE_LABELS[reg.delegateType] : 'Sin asignar'`

---

## 2026-06-02

### Fix — OXXO voucher expirado permite reintentar pago
- Al expirar un voucher OXXO el status pasa a `payment_rejected`
- El portal ahora muestra el formulario de pago Stripe con un banner del motivo de rechazo, en lugar de una tarjeta estática con botón roto
- Afecta: `apps/portal/src/components/portal/ActionBlock.tsx`

### Estructura de entornos prod/local
- `.env.local` (dev) y `.env.production` (prod) en raíz del monorepo
- Cada paquete los enlaza con symlinks: `packages/api/.env`, `packages/api/.env.production`, `apps/portal/.env.local`, `apps/admin/.env.local`
- Serverless carga `.env.{stage}` automáticamente con `useDotenv: true`

### Deploy API a producción
- Stage `production` desplegado en AWS Lambda + API Gateway
- URL base: `https://nd3hv1yg23.execute-api.us-east-2.amazonaws.com`
- Stripe webhook configurado en producción con live keys

---

## 2026-05-22

### Fase 5 — Check-in QR
- Endpoint `POST /admin/checkin` — valida QR token, marca `checked_in`
- Página `/checkin` en admin con escáner de cámara (`html5-qrcode`), resultado visual verde/amarillo/rojo, auto-reset a 4 s
- Entrada manual de token como fallback
- PWA: `manifest.json` con `start_url: /checkin`; instalable en iPhone/Android

### Fase 4 — Admin panel completo
- Stats: total, byStatus, byDelegate, byConvention, top iglesias
- Config: precio, fechas límite, campos del formulario, efectivo en sitio
- Excepciones de cupo por iglesia (solo super_admin)
- Gestión de usuarios admin (solo super_admin)
- Export CSV de todos los registros

### Fase 3 — Cartas y PDF
- Upload de carta desde portal via Firebase JS SDK (no signed URLs — CORS)
- Aprobación/rechazo de cartas en admin
- Generación de PDF de nombramiento con pdf-lib + QR
- Email de aprobación con enlace al PDF (firmado, válido 1 año)
- Storage rules: escritura en `cartas/{token}/{fileName}` hasta 10 MB

---

## 2026-05-21

### Fase 2 — Pagos Stripe
- Payment Element embebido (tarjeta, OXXO, Google/Apple Pay)
- Webhook Stripe: `payment_intent.processing`, `succeeded`, `payment_failed`, `canceled`
- Polling post-pago en tarjeta hasta confirmar via Firestore
- OXXO: voucher generado, 3 días para pagar, confirmación automática por webhook
- Endpoints: `POST /payments/create-intent`, `POST /webhooks/stripe`
- Admin: aprobación/rechazo de pagos en efectivo; `PATCH /admin/registrations/{id}/payment`

### Fase 1 — Fundación
- Monorepo pnpm workspaces: `packages/api`, `packages/shared`, `packages/emails`, `apps/portal`, `apps/admin`
- Registro 3 pasos: búsqueda de iglesia → datos personales → confirmación
- Portal personal por token UUID en URL (sin cuenta)
- Endpoints: `POST /churches/search`, `POST /registrations`, `GET /registrations/{token}`
- Email de confirmación con enlace al portal (Resend + React Email)
- Firebase Firestore + Storage + Auth configurados
