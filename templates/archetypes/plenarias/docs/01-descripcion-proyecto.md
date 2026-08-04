# Plataforma de Registro — Plenarias CNBM
## Documento Descriptivo del Proyecto

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Evento:** Plenarias de la Convención Nacional Bautista de México  
**Fecha del evento:** Octubre 2026  
**Asistentes esperados:** ~1,080 (900 el año anterior + 20% de crecimiento)

---

## 1. Descripción General

Plataforma web de registro para las Plenarias Anuales de la Convención Nacional Bautista de México (CNBM). La plataforma gestiona el proceso completo desde el registro inicial de los asistentes hasta el acceso al evento, incluyendo validación de membresía, pagos y acreditación.

El sistema maneja dos tipos de delegados con flujos diferenciados, administración por roles y check-in mediante códigos QR el día del evento.

---

## 2. Tipos de Delegado

### 2.1 Mensajero Acreditado
- Delegado oficial de la iglesia con voz y voto en las plenarias
- Cada iglesia tiene derecho a un máximo de **5 mensajeros acreditados** por defecto
- El super administrador puede otorgar cupos adicionales por excepción (caso por caso)
- Requisitos para completar registro:
  1. Pago confirmado
  2. Carta de acreditación aprobada
- Recibe Hoja de Nombramiento como Mensajero (PDF con QR) generada por el sistema

### 2.2 Fraternal
- Asistente sin voz ni voto en las plenarias
- Se asigna automáticamente cuando la iglesia ya cubrió su cupo de mensajeros acreditados
- Requisitos para completar registro:
  1. Pago confirmado (no requiere carta de acreditación)
- Recibe Hoja de Nombramiento (PDF con QR) generada por el sistema
- El sistema es escalable para habilitarle carta de acreditación si se decide en el futuro

---

## 3. Roles del Sistema

### 3.1 Registrante
- Persona que se registra a sí misma para asistir al evento
- Accede a su portal personal mediante un enlace enviado por correo (sin necesidad de crear cuenta)
- Completa el proceso en tres fases

### 3.2 Admin Operativo
- Personal de la convención encargado de operación diaria
- Aprueba pagos y cartas de acreditación
- Realiza check-in el día del evento mediante escaneo de QR

### 3.3 Super Admin
- Nivel de acceso completo
- Configura precios, fechas límite y campos del formulario
- Gestiona excepciones de cupo por iglesia
- Administra cuentas de admins operativos
- Tiene todas las capacidades del admin operativo

---

## 4. Flujos Completos

### 4.1 Fase 1 — Datos Básicos (Registro)

```
[Registrante] Accede a la plataforma
      ↓
[Sistema] ¿Registro abierto y dentro de fecha límite?
      │ No → Muestra mensaje de cierre
      ↓ Sí
[Registrante] Busca su iglesia por nombre
      ↓
[Sistema] Consulta catálogo de iglesias (API corporativa)
      ├── Iglesia encontrada → Muestra nombre y convención para confirmar
      └── Iglesia no encontrada → Muestra número telefónico para contacto
                                   Registro en pausa hasta resolución
      ↓ Iglesia confirmada
[Sistema] Evalúa cupo de mensajeros de la iglesia
      ├── Cupo disponible → Tipo = "Mensajero Acreditado"
      └── Cupo lleno → Tipo = "Fraternal"
[Registrante] Ve su tipo asignado claramente
      ↓
[Registrante] Llena formulario de datos personales:
      - Nombre completo
      - Teléfono
      - Fecha de nacimiento
      - Edad
      - Correo electrónico
      - [Campos adicionales configurados por super admin]
      ↓
[Sistema] Crea registro con estado: "Pago Pendiente"
      ↓
[Sistema] Envía correo de confirmación con:
      - Resumen del registro
      - Tipo asignado (mensajero / fraternal)
      - Enlace personal de acceso
      - Instrucciones para pago
```

**Reglas de fechas límite (configurables):**
- Fecha límite de pre-registro: cierra el formulario de registro
- Fecha límite de pago: después de esta fecha no se aceptan pagos
- Fecha límite de carta: solo aplica a mensajeros acreditados

---

### 4.2 Fase 2 — Pagos

```
[Registrante] Accede a su portal personal (vía enlace en correo)
      ↓
[Sistema] Muestra estado actual y opciones de pago
      ↓
[Registrante] Selecciona método de pago:

      ┌─── Tarjeta de crédito/débito ─────────────────────────┐
      │ → Stripe procesa pago                                   │
      │ → Confirmación automática vía webhook                   │
      │ → Estado: "Pago Aprobado" (automático)                 │
      └─────────────────────────────────────────────────────────┘

      ┌─── OXXO ──────────────────────────────────────────────┐
      │ → Sistema genera voucher OXXO                          │
      │ → Registrante tiene hasta 3 días para pagar en tienda │
      │ → Stripe confirma automáticamente vía webhook          │
      │ → Estado: "Pago Aprobado" (automático al confirmarse) │
      └─────────────────────────────────────────────────────────┘

      ┌─── Google Pay / Apple Pay ─────────────────────────────┐
      │ → Stripe procesa pago                                   │
      │ → Confirmación automática vía webhook                   │
      │ → Estado: "Pago Aprobado" (automático)                 │
      └─────────────────────────────────────────────────────────┘

      ┌─── Efectivo en sitio [solo día del evento] ────────────┐
      │ → Solo disponible cuando admin lo habilita             │
      │ → Admin registra y aprueba manualmente en el panel     │
      │ → Estado: "Pago Aprobado" (manual por admin)           │
      └─────────────────────────────────────────────────────────┘
```

**Precio:** Configurado por el super admin. Un precio estándar para ambos tipos de delegado. El admin puede hacer excepciones individuales por caso.

---

### 4.3 Fase 3 — Acceso a la Plataforma

#### Para Mensajero Acreditado:

```
[Sistema] Pago aprobado
      ↓
[Sistema] Envía correo: "Pago confirmado. Ahora sube tu carta de acreditación"
      ↓
[Registrante] Accede a su portal y sube carta de acreditación (PDF o imagen)
      ↓
[Admin] Revisa la carta en el panel de administración
      ├── Rechazar → Notifica al registrante con motivo → Puede resubir
      └── Aprobar ↓
[Sistema] Genera automáticamente la Hoja de Nombramiento como Mensajero (PDF):
      - Logo CNBM
      - Nombre completo
      - Nombre de la iglesia
      - Convención
      - Tipo: Mensajero Acreditado
      - Código QR único
      - Año del evento
      ↓
[Sistema] Envía correo con PDF adjunto
[Sistema] Hoja disponible para descarga en portal personal
[Sistema] Estado: "Totalmente Aprobado"
```

#### Para Fraternal:

```
[Sistema] Pago aprobado
      ↓
[Sistema] Genera automáticamente la Hoja de Nombramiento (PDF):
      - Logo CNBM
      - Nombre completo
      - Nombre de la iglesia
      - Convención
      - Tipo: Fraternal
      - Código QR único
      - Año del evento
      ↓
[Sistema] Envía correo con PDF adjunto
[Sistema] Hoja disponible para descarga en portal personal
[Sistema] Estado: "Totalmente Aprobado"
```

---

### 4.4 Check-in en el Evento

```
[Personal CNBM] Abre interfaz de check-in en su teléfono móvil (PWA)
      ↓
[Personal] Escanea código QR de la Hoja de Nombramiento del asistente
      ↓
[Sistema] Valida el QR:
      ├── QR inválido → Pantalla roja: "Código no válido"
      ├── Ya escaneado → Pantalla amarilla: "Ya fue registrado" + datos del registro anterior
      └── Válido → Pantalla verde: Nombre, Iglesia, Tipo (Mensajero/Fraternal)
      ↓ (si válido)
[Sistema] Marca como "Presente" con timestamp y quién lo registró
```

---

## 5. Estados de un Registro

| Estado | Descripción |
|--------|-------------|
| `pending_payment` | Registrado, esperando que realice pago |
| `payment_submitted` | Procesando pago (OXXO en tienda pendiente) |
| `payment_approved` | Pago confirmado y aprobado |
| `carta_pending` | (Solo mensajero) Pago aprobado, esperando carta |
| `carta_submitted` | (Solo mensajero) Carta subida, en revisión |
| `carta_rejected` | (Solo mensajero) Carta rechazada, puede resubir |
| `payment_rejected` | Pago rechazado por admin |
| `fully_approved` | Proceso completo, QR generado y enviado |
| `checked_in` | Asistente presente en el evento |
| `pending_onsite_payment` | Registro en sitio, pago en efectivo pendiente |

---

## 6. Notificaciones por Correo

| Evento | Destinatario | Contenido |
|--------|-------------|-----------|
| Registro exitoso | Registrante | Confirmación + enlace portal + instrucciones |
| Voucher OXXO generado | Registrante | Código y datos para pago en tienda |
| Pago aprobado (mensajero) | Registrante | Instrucciones para subir carta |
| Pago aprobado (fraternal) | Registrante | Hoja de nombramiento lista para descarga |
| Pago rechazado | Registrante | Motivo + enlace para reintentar |
| Carta rechazada | Registrante | Motivo + enlace para resubir |
| Aprobación final (mensajero) | Registrante | PDF de hoja de nombramiento adjunto |

---

## 7. Panel de Administración

### Super Admin — Funcionalidades
- Configurar precio del registro (estándar y excepciones individuales)
- Configurar fechas límite (pre-registro, pago, carta)
- Agregar y gestionar campos del formulario de registro
- Gestionar excepciones de cupo de mensajeros por iglesia
- Crear y desactivar cuentas de admins operativos
- Habilitar/deshabilitar registro de efectivo en sitio
- Todas las funcionalidades del admin operativo

### Admin Operativo — Funcionalidades
- Ver lista de todos los registros con filtros avanzados
- Ver detalle completo de cada registro
- Aprobar o rechazar pagos en efectivo (con motivo en rechazo)
- Aprobar o rechazar cartas de acreditación (con motivo en rechazo)
- Escanear QR para check-in desde móvil
- Ver estadísticas del evento
- Exportar registros a Excel/CSV

---

## 8. Alcance y Limitaciones

**Dentro del alcance:**
- Registro individual de asistentes
- Gestión de cupos por tipo de delegado
- Cobro vía Stripe (tarjeta, OXXO, Google Pay, Apple Pay)
- Cobro en efectivo en sitio (habilitado por admin)
- Gestión de cartas de acreditación
- Generación de documentos oficiales con QR
- Check-in en sitio mediante QR
- Panel de administración con jerarquía de roles

**Fuera del alcance (versión inicial):**
- Registro grupal por parte de representantes de iglesia
- Pagos en parcialidades
- Módulo de hospedaje o logística
- App móvil nativa (check-in es PWA en navegador)
- Integración con sistemas externos más allá de la API corporativa

---

## 9. Infraestructura

| Componente | Servicio |
|-----------|---------|
| Frontend (portal + admin) | Next.js en AWS Amplify |
| Backend | Serverless Framework (AWS Lambda + API Gateway) |
| Base de datos | Firebase Firestore |
| Almacenamiento de archivos | Firebase Storage |
| Autenticación (admins) | Firebase Authentication |
| Pagos | Stripe |
| Correos electrónicos | Resend |
| Dominio | Subdominio configurado en Hostinger |
