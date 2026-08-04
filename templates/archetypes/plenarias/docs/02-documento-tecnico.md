# Documento Técnico de Implementación
## Plataforma de Registro — Plenarias CNBM

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Stack:** Next.js · Serverless Framework · Firebase · Stripe · Resend

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Next.js (App Router) | 15.x |
| Lenguaje | TypeScript | 5.x |
| Backend | Serverless Framework | 4.x |
| Runtime Lambda | Node.js | 20.x |
| Base de datos | Firebase Firestore | SDK v10 |
| Storage | Firebase Storage | SDK v10 |
| Auth (admins) | Firebase Authentication | SDK v10 |
| Pagos | Stripe | API v2024 |
| Email | Resend | SDK v3 |
| PDF | pdf-lib | 1.x |
| QR | qrcode | 1.x |
| Hosting frontend | AWS Amplify | Gen 2 |
| Dominio | Hostinger (subdominio CNBM) | — |
| Package manager | pnpm | 9.x |
| Monorepo | pnpm workspaces | — |

---

## 2. Estructura del Proyecto

```
registro-plenarias/
├── apps/
│   ├── portal/                    # Next.js — Portal del registrante
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx               # Landing / Home
│   │   │   │   ├── registro/
│   │   │   │   │   └── page.tsx           # Formulario de registro (multi-step)
│   │   │   │   └── mi-registro/
│   │   │   │       └── page.tsx           # Portal personal del registrante
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── api.ts                     # Cliente HTTP hacia el backend
│   │   │   └── stripe.ts                  # Stripe.js client
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── admin/                     # Next.js — Panel de administración
│       ├── app/
│       │   ├── (auth)/
│       │   │   └── login/
│       │   │       └── page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx             # Sidebar + auth guard
│       │   │   ├── page.tsx               # Dashboard / Stats
│       │   │   ├── registros/
│       │   │   │   ├── page.tsx           # Lista de registros
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx       # Detalle de registro
│       │   │   ├── checkin/
│       │   │   │   └── page.tsx           # Scanner QR (PWA mobile)
│       │   │   └── configuracion/         # Solo super_admin
│       │   │       ├── page.tsx           # Config general
│       │   │       ├── iglesias/
│       │   │       │   └── page.tsx       # Excepciones de cupo
│       │   │       └── admins/
│       │   │           └── page.tsx       # Gestión de admins
│       │   └── layout.tsx
│       ├── components/
│       ├── lib/
│       │   └── firebase-admin-client.ts   # Firebase Auth client SDK
│       ├── next.config.ts
│       └── package.json
│
├── packages/
│   ├── api/                       # Serverless Framework
│   │   ├── src/
│   │   │   ├── functions/
│   │   │   │   ├── registrations/
│   │   │   │   │   ├── create.ts
│   │   │   │   │   ├── get.ts
│   │   │   │   │   └── uploadCarta.ts
│   │   │   │   ├── payments/
│   │   │   │   │   ├── createIntent.ts
│   │   │   │   │   └── webhook.ts
│   │   │   │   ├── churches/
│   │   │   │   │   └── search.ts
│   │   │   │   ├── documents/
│   │   │   │   │   └── generateNominationSheet.ts
│   │   │   │   └── admin/
│   │   │   │       ├── registrations/
│   │   │   │       │   ├── list.ts
│   │   │   │       │   ├── get.ts
│   │   │   │       │   ├── approvePayment.ts
│   │   │   │       │   ├── rejectPayment.ts
│   │   │   │       │   ├── approveCarta.ts
│   │   │   │       │   ├── rejectCarta.ts
│   │   │   │       │   ├── checkin.ts
│   │   │   │       │   └── registerCash.ts
│   │   │   │       ├── stats.ts
│   │   │   │       ├── export.ts
│   │   │   │       ├── config/
│   │   │   │       │   ├── get.ts
│   │   │   │       │   └── update.ts
│   │   │   │       ├── exceptions/
│   │   │   │       │   ├── list.ts
│   │   │   │       │   └── upsert.ts
│   │   │   │       └── admins/
│   │   │   │           ├── list.ts
│   │   │   │           ├── create.ts
│   │   │   │           └── deactivate.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts                # Verifica Firebase ID token
│   │   │   │   ├── requireAdmin.ts        # Role: admin | super_admin
│   │   │   │   ├── requireSuperAdmin.ts   # Role: super_admin only
│   │   │   │   └── tokenAuth.ts           # Verifica accessToken de registrante
│   │   │   ├── lib/
│   │   │   │   ├── firebase.ts            # Firebase Admin SDK init
│   │   │   │   ├── stripe.ts              # Stripe client init
│   │   │   │   ├── resend.ts              # Resend client init
│   │   │   │   ├── pdfGenerator.ts        # Generación de PDF con QR
│   │   │   │   └── corporateDb.ts         # Cliente para API corporativa
│   │   │   └── types/
│   │   │       └── index.ts               # Tipos compartidos con packages/shared
│   │   ├── serverless.yml
│   │   └── package.json
│   │
│   └── shared/                    # Tipos y utilidades compartidas
│       ├── src/
│       │   ├── types/
│       │   │   ├── registration.ts
│       │   │   ├── config.ts
│       │   │   └── admin.ts
│       │   └── constants/
│       │       └── index.ts
│       └── package.json
│
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. Schema de Base de Datos (Firestore)

### 3.1 Colección: `registrations`

```typescript
// registrations/{registrationId}

interface Registration {
  id: string;

  // Tipo y estado
  type: 'mensajero_acreditado' | 'fraternal';
  status: RegistrationStatus;

  // Iglesia
  churchId: string;
  churchName: string;
  conventionName: string;

  // Datos personales (campos base + extensibles)
  fields: {
    name: string;
    email: string;
    phone: string;
    dob: string;        // ISO 8601: YYYY-MM-DD
    age: number;
    [key: string]: any; // campos adicionales configurados por super admin
  };

  // Pago
  paymentMethod?: 'stripe_card' | 'stripe_oxxo' | 'stripe_google_pay' | 'stripe_apple_pay' | 'cash';
  paymentAmount: number;             // centavos MXN (ej: 50000 = $500 MXN)
  paymentStatus: PaymentStatus;
  stripePaymentIntentId?: string;
  stripePaymentMethodType?: string;  // para analytics
  paymentApprovedAt?: Timestamp;
  paymentApprovedBy?: string;        // admin uid
  paymentRejectedReason?: string;
  paymentRejectedAt?: Timestamp;

  // Carta de acreditación (solo mensajero_acreditado, extensible a fraternal)
  cartaUrl?: string;                 // Firebase Storage path
  cartaStatus?: 'pending' | 'submitted' | 'approved' | 'rejected';
  cartaUploadedAt?: Timestamp;
  cartaApprovedAt?: Timestamp;
  cartaApprovedBy?: string;
  cartaRejectedReason?: string;
  cartaRejectedAt?: Timestamp;

  // Documento final
  qrToken: string;                   // UUID v4, generado al crear el registro
  nominationSheetUrl?: string;       // Firebase Storage path del PDF generado
  nominationSheetGeneratedAt?: Timestamp;

  // Check-in
  checkedIn: boolean;
  checkedInAt?: Timestamp;
  checkedInBy?: string;              // admin uid

  // Acceso al portal personal
  accessToken: string;               // UUID v4 (almacenado en texto plano — no es credencial crítica)
  accessTokenExpiresAt: Timestamp;   // 90 días desde creación

  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type RegistrationStatus =
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_approved'
  | 'payment_rejected'
  | 'carta_pending'          // solo mensajero_acreditado
  | 'carta_submitted'        // solo mensajero_acreditado
  | 'carta_rejected'         // solo mensajero_acreditado
  | 'fully_approved'
  | 'checked_in'
  | 'pending_onsite_payment';

type PaymentStatus =
  | 'pending'
  | 'submitted'   // OXXO: voucher generado, esperando pago en tienda
  | 'approved'
  | 'rejected';
```

**Índices Firestore requeridos:**
```
registrations: status (ASC), createdAt (DESC)
registrations: churchId (ASC), type (ASC)
registrations: churchId (ASC), status (ASC)
registrations: type (ASC), status (ASC)
registrations: checkedIn (ASC), checkedInAt (DESC)
```

---

### 3.2 Colección: `church_quotas`

```typescript
// church_quotas/{churchId}

interface ChurchQuota {
  churchId: string;
  churchName: string;
  conventionName: string;
  defaultLimit: number;          // siempre 5
  overrideLimit?: number;        // set por super_admin
  effectiveLimit: number;        // overrideLimit ?? defaultLimit
  mensajerosCount: number;       // contador en tiempo real
  updatedBy?: string;            // super_admin uid
  updatedAt?: Timestamp;
}
```

**Transacción al registrar un mensajero:**
```typescript
// Se ejecuta en transacción Firestore para evitar race conditions
async function claimMensajeroSlot(churchId: string): Promise<'mensajero_acreditado' | 'fraternal'> {
  return await db.runTransaction(async (tx) => {
    const quotaRef = db.collection('church_quotas').doc(churchId);
    const quotaDoc = await tx.get(quotaRef);

    if (!quotaDoc.exists) {
      // Primera vez que se registra alguien de esta iglesia
      tx.set(quotaRef, {
        churchId,
        defaultLimit: 5,
        effectiveLimit: 5,
        mensajerosCount: 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return 'mensajero_acreditado';
    }

    const quota = quotaDoc.data() as ChurchQuota;
    if (quota.mensajerosCount < quota.effectiveLimit) {
      tx.update(quotaRef, {
        mensajerosCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return 'mensajero_acreditado';
    }

    return 'fraternal';
  });
}
```

---

### 3.3 Documento: `config/global`

```typescript
// config/global (documento único)

interface GlobalConfig {
  // Precio
  standardPrice: number;                      // centavos MXN
  priceExceptions: Record<string, number>;    // { [registrationId]: amount }

  // Fechas límite
  deadlines: {
    preRegistration: Timestamp;  // cierre del formulario de registro
    payment: Timestamp;          // cierre de pagos
    carta: Timestamp;            // cierre de upload de cartas
  };

  // Campos del formulario (base + extensibles)
  formFields: FormField[];

  // Estado del sistema
  registrationOpen: boolean;
  onsiteCashEnabled: boolean;   // activado manualmente el día del evento

  // Metadatos
  updatedAt: Timestamp;
  updatedBy: string;
}

interface FormField {
  key: string;           // identificador único, ej: "nombre"
  label: string;         // texto visible, ej: "Nombre completo"
  type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'select';
  required: boolean;
  options?: string[];    // solo para type: 'select'
  order: number;         // orden de aparición en el formulario
  isBase: boolean;       // true = campo base, no se puede eliminar
}

// Campos base (isBase: true, siempre presentes):
const BASE_FIELDS: FormField[] = [
  { key: 'name',  label: 'Nombre completo',      type: 'text',   required: true,  order: 1, isBase: true },
  { key: 'email', label: 'Correo electrónico',   type: 'email',  required: true,  order: 2, isBase: true },
  { key: 'phone', label: 'Teléfono',             type: 'phone',  required: true,  order: 3, isBase: true },
  { key: 'dob',   label: 'Fecha de nacimiento',  type: 'date',   required: true,  order: 4, isBase: true },
  { key: 'age',   label: 'Edad',                 type: 'number', required: true,  order: 5, isBase: true },
];
```

---

### 3.4 Colección: `admins`

```typescript
// admins/{uid}

interface Admin {
  uid: string;           // Firebase Auth UID
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin';
  active: boolean;
  createdAt: Timestamp;
  createdBy: string;     // super_admin uid
  deactivatedAt?: Timestamp;
  deactivatedBy?: string;
}
```

---

## 4. API Endpoints

### 4.1 Endpoints Públicos (sin autenticación)

```
POST /registrations
  Descripción: Crear nuevo registro
  Body: {
    churchId: string
    churchName: string
    conventionName: string
    fields: Record<string, any>
  }
  Response 201: {
    registrationId: string
    accessToken: string
    type: 'mensajero_acreditado' | 'fraternal'
    message: string
  }
  Validaciones:
    - Fechas límite vigentes (config.deadlines.preRegistration)
    - config.registrationOpen === true
    - Campos requeridos según config.formFields
    - Email no duplicado para misma iglesia

GET /registrations/:id
  Descripción: Ver estado del propio registro
  Headers: Authorization: Bearer {accessToken}
  Response 200: Registration (sin campos internos sensibles)

POST /registrations/:id/payment/intent
  Descripción: Crear PaymentIntent de Stripe
  Headers: Authorization: Bearer {accessToken}
  Body: { method: 'card' | 'oxxo' | 'google_pay' | 'apple_pay' }
  Response 200: {
    clientSecret: string
    amount: number
    currency: 'mxn'
  }
  Validaciones:
    - config.deadlines.payment vigente
    - registration.status === 'pending_payment'

PUT /registrations/:id/carta
  Descripción: Upload carta de acreditación
  Headers: Authorization: Bearer {accessToken}
  Body: multipart/form-data { file: File }
  Response 200: { cartaUrl: string }
  Validaciones:
    - registration.type === 'mensajero_acreditado'
    - registration.status === 'payment_approved' | 'carta_pending' | 'carta_rejected'
    - config.deadlines.carta vigente
    - Archivo: PDF o imagen, máx 10MB

POST /stripe/webhook
  Descripción: Webhook de Stripe (sin auth, validado por firma)
  Headers: stripe-signature
  Eventos manejados:
    - payment_intent.succeeded → actualiza status a payment_approved
    - payment_intent.payment_failed → notifica al registrante

GET /config/public
  Descripción: Configuración pública del evento
  Response 200: {
    standardPrice: number
    deadlines: { preRegistration, payment, carta }
    formFields: FormField[]
    registrationOpen: boolean
    onsiteCashEnabled: boolean
  }

POST /churches/search
  Descripción: Búsqueda de iglesias en API corporativa
  Body: { query: string }
  Response 200: {
    found: boolean
    churches?: Array<{ id, name, conventionName }>
    contactPhone?: string   // solo cuando found === false
  }
  Rate limit: 10 req/min por IP
```

---

### 4.2 Endpoints de Admin (Firebase ID Token requerido)

```
# Registros
GET /admin/registrations
  Query params: status?, type?, churchId?, search?, page?, limit?
  Response 200: {
    data: Registration[]
    total: number
    page: number
    totalPages: number
  }

GET /admin/registrations/:id
  Response 200: Registration (completo)

PUT /admin/registrations/:id/payment/approve
  Body: { adjustedAmount?: number }  // opcional: excepción de precio
  Response 200: { registration: Registration }
  Side effects:
    - Actualiza status según tipo (mensajero → carta_pending, fraternal → fully_approved)
    - Dispara generación de PDF si fraternal
    - Envía email correspondiente

PUT /admin/registrations/:id/payment/reject
  Body: { reason: string }
  Response 200: { registration: Registration }
  Side effects: Envía email con motivo

PUT /admin/registrations/:id/carta/approve
  Response 200: { registration: Registration }
  Side effects:
    - Actualiza status → fully_approved
    - Dispara generación de PDF
    - Envía email con PDF adjunto

PUT /admin/registrations/:id/carta/reject
  Body: { reason: string }
  Response 200: { registration: Registration }
  Side effects: Envía email con motivo

POST /admin/registrations/:id/checkin
  Response 200: { registration: Registration, alreadyCheckedIn: boolean }

POST /admin/registrations/cash
  Descripción: Registrar asistente que paga efectivo en sitio
  Body: { churchId, churchName, conventionName, fields }
  Validaciones:
    - config.onsiteCashEnabled === true
    - Requiere rol admin
  Response 201: Registration con status: pending_onsite_payment

GET /admin/stats
  Response 200: {
    total: number
    byType: { mensajero_acreditado: number, fraternal: number }
    byStatus: Record<RegistrationStatus, number>
    byPaymentMethod: Record<string, number>
    checkedIn: number
    topChurches: Array<{ churchName, count }>
    revenueTotal: number   // centavos MXN
  }

GET /admin/export
  Query: format='csv'|'xlsx'
  Response: archivo descargable

# Configuración (solo super_admin)
GET /admin/config
  Response 200: GlobalConfig

PUT /admin/config
  Body: Partial<GlobalConfig>
  Response 200: GlobalConfig

# Excepciones de cupo (solo super_admin)
GET /admin/exceptions
  Response 200: ChurchQuota[]

POST /admin/exceptions
  Body: { churchId: string, churchName: string, overrideLimit: number }
  Response 200: ChurchQuota

# Gestión de admins (solo super_admin)
GET /admin/admins
  Response 200: Admin[]

POST /admin/admins
  Body: { email: string, displayName: string, role: 'admin' | 'super_admin' }
  Side effects: Crea usuario en Firebase Auth + envía email de bienvenida
  Response 201: Admin

PUT /admin/admins/:uid/deactivate
  Response 200: Admin

# Validación QR (para check-in)
GET /admin/checkin/validate/:qrToken
  Response 200: {
    valid: boolean
    alreadyCheckedIn: boolean
    registration?: {
      name: string
      churchName: string
      type: string
      checkedInAt?: string
    }
  }
```

---

## 5. Autenticación

### 5.1 Registrantes (accessToken)

```typescript
// Al crear el registro
const accessToken = randomUUID();  // UUID v4
const expiresAt = Timestamp.fromDate(addDays(new Date(), 90));

// Almacenado en texto plano en Firestore (no es credencial crítica)
// El portal personal usa: /mi-registro?id={registrationId}&token={accessToken}

// Middleware tokenAuth.ts
async function tokenAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.params;

  const reg = await db.collection('registrations').doc(id).get();
  if (!reg.exists) return res.status(404).json({ error: 'Not found' });

  const data = reg.data();
  if (data.accessToken !== token) return res.status(401).json({ error: 'Unauthorized' });
  if (data.accessTokenExpiresAt.toDate() < new Date()) {
    return res.status(401).json({ error: 'Token expired' });
  }

  req.registration = data;
  next();
}
```

### 5.2 Admins (Firebase Auth)

```typescript
// Middleware auth.ts
import { auth } from '../lib/firebase';

async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = await auth.verifyIdToken(token);
    const adminDoc = await db.collection('admins').doc(decoded.uid).get();

    if (!adminDoc.exists || !adminDoc.data().active) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.admin = { uid: decoded.uid, ...adminDoc.data() };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function requireSuperAdmin(req, res, next) {
  await requireAdmin(req, res, () => {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin required' });
    }
    next();
  });
}
```

---

## 6. Integración Stripe

### 6.1 Configuración de cuenta
- Nueva cuenta Stripe con email diferente al evento existente
- Moneda base: MXN
- Habilitar métodos de pago: Cards, OXXO, Google Pay, Apple Pay
- Webhook endpoint: `POST /stripe/webhook`
- Eventos a escuchar:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.dispute.created` (para alertas)

### 6.2 Crear PaymentIntent (Lambda)

```typescript
// functions/payments/createIntent.ts
export async function handler(event) {
  const { registrationId, method } = JSON.parse(event.body);

  const registration = await getRegistration(registrationId);
  const config = await getGlobalConfig();
  const amount = config.priceExceptions[registrationId] ?? config.standardPrice;

  const paymentMethodTypes = {
    card: ['card'],
    oxxo: ['oxxo'],
    google_pay: ['card'],   // Google Pay usa el tipo 'card' en Stripe
    apple_pay: ['card'],    // Apple Pay usa el tipo 'card' en Stripe
  };

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'mxn',
    payment_method_types: paymentMethodTypes[method],
    metadata: {
      registrationId,
      type: registration.type,
      churchId: registration.churchId,
    },
    ...(method === 'oxxo' && {
      payment_method_options: {
        oxxo: { expires_after_days: 3 },
      },
    }),
  });

  await db.collection('registrations').doc(registrationId).update({
    stripePaymentIntentId: paymentIntent.id,
    paymentMethod: `stripe_${method}`,
    paymentAmount: amount,
    paymentStatus: 'submitted',
    status: 'payment_submitted',
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { statusCode: 200, body: JSON.stringify({ clientSecret: paymentIntent.client_secret, amount, currency: 'mxn' }) };
}
```

### 6.3 Webhook Handler (Lambda)

```typescript
// functions/payments/webhook.ts
export async function handler(event) {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return { statusCode: 400 };
  }

  if (stripeEvent.type === 'payment_intent.succeeded') {
    const intent = stripeEvent.data.object;
    const { registrationId, type } = intent.metadata;

    const registration = await getRegistration(registrationId);
    const nextStatus = type === 'mensajero_acreditado' ? 'carta_pending' : 'fully_approved';

    await db.collection('registrations').doc(registrationId).update({
      paymentStatus: 'approved',
      paymentApprovedAt: FieldValue.serverTimestamp(),
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (type === 'fraternal') {
      await generateAndSendNominationSheet(registrationId);
    } else {
      await sendPaymentApprovedMensajeroEmail(registration);
    }
  }

  if (stripeEvent.type === 'payment_intent.payment_failed') {
    const intent = stripeEvent.data.object;
    await handlePaymentFailed(intent.metadata.registrationId);
  }

  return { statusCode: 200 };
}
```

---

## 7. Generación de PDF con QR

```typescript
// lib/pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { getStorage } from 'firebase-admin/storage';

export async function generateNominationSheet(registration: Registration): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // Encabezado
  page.drawText('CONVENCIÓN NACIONAL BAUTISTA DE MÉXICO', {
    x: 50, y: height - 80,
    size: 14, font: fontBold,
    color: rgb(0.1, 0.1, 0.4),
  });

  page.drawText('HOJA DE NOMBRAMIENTO COMO MENSAJERO', {
    x: 50, y: height - 110,
    size: 18, font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(`PLENARIAS ${new Date().getFullYear()}`, {
    x: 50, y: height - 135,
    size: 12, font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Línea separadora
  page.drawLine({
    start: { x: 50, y: height - 150 },
    end: { x: width - 50, y: height - 150 },
    thickness: 1, color: rgb(0.7, 0.7, 0.7),
  });

  // Datos del delegado
  const dataStartY = height - 200;
  const fields = [
    { label: 'Nombre:', value: registration.fields.name },
    { label: 'Iglesia:', value: registration.churchName },
    { label: 'Convención:', value: registration.conventionName },
    { label: 'Tipo:', value: registration.type === 'mensajero_acreditado' ? 'Mensajero Acreditado' : 'Fraternal' },
  ];

  fields.forEach((field, i) => {
    page.drawText(field.label, { x: 50, y: dataStartY - (i * 35), size: 11, font: fontBold });
    page.drawText(field.value, { x: 160, y: dataStartY - (i * 35), size: 11, font });
  });

  // Código QR
  const qrUrl = `${process.env.ADMIN_URL}/checkin/validate/${registration.qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 200, margin: 1 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  page.drawImage(qrImage, {
    x: width - 200,
    y: dataStartY - 100,
    width: 150,
    height: 150,
  });

  page.drawText('Escanea para verificar', {
    x: width - 195, y: dataStartY - 115,
    size: 8, font, color: rgb(0.5, 0.5, 0.5),
  });

  // Footer
  page.drawText('Este documento es personal e intransferible', {
    x: 50, y: 50, size: 9, font, color: rgb(0.6, 0.6, 0.6),
  });

  const pdfBytes = await pdfDoc.save();

  // Upload a Firebase Storage
  const bucket = getStorage().bucket();
  const filePath = `nomination-sheets/${registration.id}.pdf`;
  const file = bucket.file(filePath);
  await file.save(Buffer.from(pdfBytes), { contentType: 'application/pdf' });

  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 días
  });

  return signedUrl;
}
```

---

## 8. Integración Resend — Templates de Email

```typescript
// lib/resend.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Plenarias CNBM <noreply@plenarias.cnbm.org.mx>';

export async function sendRegistrationConfirmed(registration: Registration) {
  const portalUrl = `${process.env.APP_URL}/mi-registro?id=${registration.id}&token=${registration.accessToken}`;
  await resend.emails.send({
    from: FROM,
    to: registration.fields.email,
    subject: 'Registro confirmado — Plenarias CNBM 2026',
    html: registrationConfirmedTemplate({ registration, portalUrl }),
  });
}

export async function sendPaymentApprovedMensajero(registration: Registration) {
  const portalUrl = `${process.env.APP_URL}/mi-registro?id=${registration.id}&token=${registration.accessToken}`;
  await resend.emails.send({
    from: FROM,
    to: registration.fields.email,
    subject: 'Pago confirmado — Sube tu carta de acreditación',
    html: paymentApprovedMensajeroTemplate({ registration, portalUrl }),
  });
}

export async function sendFullyApproved(registration: Registration, nominationSheetUrl: string) {
  await resend.emails.send({
    from: FROM,
    to: registration.fields.email,
    subject: '¡Registro completo! Tu hoja de nombramiento — Plenarias CNBM 2026',
    html: fullyApprovedTemplate({ registration, nominationSheetUrl }),
    attachments: [{
      filename: 'hoja-nombramiento.pdf',
      path: nominationSheetUrl,
    }],
  });
}

// Otras: sendOxxoVoucher, sendPaymentRejected, sendCartaRejected
```

---

## 9. Integración API Corporativa (Caja Negra)

```typescript
// lib/corporateDb.ts
import axios from 'axios';

interface ChurchSearchResult {
  found: boolean;
  churches?: Array<{ id: string; name: string; conventionName: string }>;
  contactPhone?: string;
}

export async function searchChurches(query: string): Promise<ChurchSearchResult> {
  try {
    const response = await axios.get(`${process.env.CORPORATE_DB_API_URL}/churches`, {
      params: { q: query },
      headers: { 'Authorization': `Bearer ${process.env.CORPORATE_DB_API_KEY}` },
      timeout: 5000,
    });

    if (response.data.results?.length > 0) {
      return {
        found: true,
        churches: response.data.results.map(r => ({
          id: r.id,
          name: r.name,
          conventionName: r.convention,
        })),
      };
    }

    return { found: false, contactPhone: process.env.CONTACT_PHONE };
  } catch (error) {
    // Si la API corporativa falla, retornar número de contacto
    console.error('Corporate DB error:', error);
    return { found: false, contactPhone: process.env.CONTACT_PHONE };
  }
}
```

**Nota:** Si la API corporativa no tiene documentación disponible, esta función sirve como adaptador. Los tipos de retorno son fijos desde nuestro lado; solo se adapta el `response.data` al formato interno.

---

## 10. Firebase Storage — Reglas de Seguridad

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Cartas de acreditación — solo el propio registrante puede subir
    // El accessToken se valida en backend antes de generar la URL de upload firmada
    match /cartas/{registrationId}/{fileName} {
      allow read: if false;   // Solo accesible vía Admin SDK o URL firmada
      allow write: if false;  // Solo vía Admin SDK
    }

    // Hojas de nombramiento — solo lectura vía URL firmada
    match /nomination-sheets/{fileName} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

**Nota:** Todo el acceso a Storage se hace vía Firebase Admin SDK en las Lambdas. Los clientes nunca escriben directamente a Storage; reciben URLs firmadas generadas por el servidor.

---

## 11. Serverless Framework — Configuración

```yaml
# serverless.yml
service: registro-plenarias-api
frameworkVersion: '4'

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    FIREBASE_PROJECT_ID: ${env:FIREBASE_PROJECT_ID}
    FIREBASE_CLIENT_EMAIL: ${env:FIREBASE_CLIENT_EMAIL}
    FIREBASE_PRIVATE_KEY: ${env:FIREBASE_PRIVATE_KEY}
    FIREBASE_STORAGE_BUCKET: ${env:FIREBASE_STORAGE_BUCKET}
    STRIPE_SECRET_KEY: ${env:STRIPE_SECRET_KEY}
    STRIPE_WEBHOOK_SECRET: ${env:STRIPE_WEBHOOK_SECRET}
    RESEND_API_KEY: ${env:RESEND_API_KEY}
    RESEND_FROM_EMAIL: ${env:RESEND_FROM_EMAIL}
    APP_URL: ${env:APP_URL}
    ADMIN_URL: ${env:ADMIN_URL}
    CORPORATE_DB_API_URL: ${env:CORPORATE_DB_API_URL}
    CORPORATE_DB_API_KEY: ${env:CORPORATE_DB_API_KEY}
    CONTACT_PHONE: ${env:CONTACT_PHONE}

  httpApi:
    cors:
      allowedOrigins:
        - ${env:APP_URL}
        - ${env:ADMIN_URL}
      allowedHeaders:
        - Content-Type
        - Authorization
      allowedMethods:
        - GET
        - POST
        - PUT
        - DELETE

functions:
  # Públicos
  createRegistration:
    handler: src/functions/registrations/create.handler
    events:
      - httpApi: { path: /registrations, method: POST }

  getRegistration:
    handler: src/functions/registrations/get.handler
    events:
      - httpApi: { path: /registrations/{id}, method: GET }

  createPaymentIntent:
    handler: src/functions/payments/createIntent.handler
    events:
      - httpApi: { path: /registrations/{id}/payment/intent, method: POST }

  uploadCarta:
    handler: src/functions/registrations/uploadCarta.handler
    events:
      - httpApi: { path: /registrations/{id}/carta, method: PUT }

  stripeWebhook:
    handler: src/functions/payments/webhook.handler
    events:
      - httpApi: { path: /stripe/webhook, method: POST }

  searchChurches:
    handler: src/functions/churches/search.handler
    events:
      - httpApi: { path: /churches/search, method: POST }

  getPublicConfig:
    handler: src/functions/config/getPublic.handler
    events:
      - httpApi: { path: /config/public, method: GET }

  # Admin
  listRegistrations:
    handler: src/functions/admin/registrations/list.handler
    events:
      - httpApi: { path: /admin/registrations, method: GET }

  getRegistrationAdmin:
    handler: src/functions/admin/registrations/get.handler
    events:
      - httpApi: { path: /admin/registrations/{id}, method: GET }

  approvePayment:
    handler: src/functions/admin/registrations/approvePayment.handler
    events:
      - httpApi: { path: /admin/registrations/{id}/payment/approve, method: PUT }

  rejectPayment:
    handler: src/functions/admin/registrations/rejectPayment.handler
    events:
      - httpApi: { path: /admin/registrations/{id}/payment/reject, method: PUT }

  approveCarta:
    handler: src/functions/admin/registrations/approveCarta.handler
    events:
      - httpApi: { path: /admin/registrations/{id}/carta/approve, method: PUT }

  rejectCarta:
    handler: src/functions/admin/registrations/rejectCarta.handler
    events:
      - httpApi: { path: /admin/registrations/{id}/carta/reject, method: PUT }

  checkin:
    handler: src/functions/admin/registrations/checkin.handler
    events:
      - httpApi: { path: /admin/registrations/{id}/checkin, method: POST }

  validateQR:
    handler: src/functions/admin/checkin/validate.handler
    events:
      - httpApi: { path: /admin/checkin/validate/{qrToken}, method: GET }

  registerCash:
    handler: src/functions/admin/registrations/registerCash.handler
    events:
      - httpApi: { path: /admin/registrations/cash, method: POST }

  getStats:
    handler: src/functions/admin/stats.handler
    events:
      - httpApi: { path: /admin/stats, method: GET }

  exportRegistrations:
    handler: src/functions/admin/export.handler
    timeout: 60
    events:
      - httpApi: { path: /admin/export, method: GET }

  getConfig:
    handler: src/functions/admin/config/get.handler
    events:
      - httpApi: { path: /admin/config, method: GET }

  updateConfig:
    handler: src/functions/admin/config/update.handler
    events:
      - httpApi: { path: /admin/config, method: PUT }

  getExceptions:
    handler: src/functions/admin/exceptions/list.handler
    events:
      - httpApi: { path: /admin/exceptions, method: GET }

  upsertException:
    handler: src/functions/admin/exceptions/upsert.handler
    events:
      - httpApi: { path: /admin/exceptions, method: POST }

  listAdmins:
    handler: src/functions/admin/admins/list.handler
    events:
      - httpApi: { path: /admin/admins, method: GET }

  createAdmin:
    handler: src/functions/admin/admins/create.handler
    events:
      - httpApi: { path: /admin/admins, method: POST }

  deactivateAdmin:
    handler: src/functions/admin/admins/deactivate.handler
    events:
      - httpApi: { path: /admin/admins/{uid}/deactivate, method: PUT }

plugins:
  - serverless-esbuild
  - serverless-offline
```

---

## 12. Variables de Entorno

### Portal del Registrante (`apps/portal/.env`)
```
NEXT_PUBLIC_API_URL=https://api.plenarias.cnbm.org.mx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Panel de Admin (`apps/admin/.env`)
```
NEXT_PUBLIC_API_URL=https://api.plenarias.cnbm.org.mx
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### API Lambda (`packages/api/.env`)
```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@plenarias.cnbm.org.mx

APP_URL=https://plenarias.cnbm.org.mx
ADMIN_URL=https://admin.plenarias.cnbm.org.mx

CORPORATE_DB_API_URL=
CORPORATE_DB_API_KEY=
CONTACT_PHONE=
```

---

## 13. Amplify — Configuración

```yaml
# amplify.yml (en cada app de Next.js)
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm --filter portal build   # o admin
  artifacts:
    baseDirectory: apps/portal/.next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - apps/portal/.next/cache/**/*
```

**Dominios:**
- Portal: `plenarias.cnbm.org.mx` → CNAME a Amplify en Hostinger
- Admin: `admin.plenarias.cnbm.org.mx` → CNAME a Amplify en Hostinger
- API: `api.plenarias.cnbm.org.mx` → API Gateway custom domain

---

## 14. Plan de Implementación por Fases

### Fase 1 — Fundación (2 semanas)
- [ ] Setup monorepo pnpm workspaces
- [ ] Setup Serverless Framework con serverless-esbuild y serverless-offline
- [ ] Firebase: proyecto, Firestore, Storage, reglas de seguridad
- [ ] Implementar `POST /churches/search` (proxy a API corporativa)
- [ ] Implementar `POST /registrations` con lógica de cupo (transacción Firestore)
- [ ] Implementar `GET /registrations/:id` con tokenAuth middleware
- [ ] Implementar `GET /config/public`
- [ ] Setup Resend: template registro_confirmado
- [ ] Portal Next.js: landing page
- [ ] Portal Next.js: formulario de registro multi-step (3 pasos: iglesia → datos → confirmar)
- [ ] Portal Next.js: página "mi-registro" con estado actual
- [ ] Deploy inicial a Amplify + configuración de dominio en Hostinger

### Fase 2 — Pagos (2 semanas)
- [ ] Crear y configurar cuenta Stripe (MXN, OXXO, Google Pay, Apple Pay)
- [ ] Implementar `POST /registrations/:id/payment/intent`
- [ ] Implementar `POST /stripe/webhook` con validación de firma
- [ ] Portal: página de pago con Stripe Payment Element
- [ ] Portal: página de voucher OXXO (instrucciones + código)
- [ ] Portal: polling o webhook SSE para actualización de estado en tiempo real
- [ ] Setup Firebase Auth para admins
- [ ] Admin Next.js: login page
- [ ] Admin Next.js: lista de registros con filtros (status, tipo, iglesia)
- [ ] Admin Next.js: detalle de registro
- [ ] Admin: approvePayment y rejectPayment endpoints + UI
- [ ] Admin: registerCash + aprobación de efectivo
- [ ] Emails: payment_oxxo_voucher, payment_approved_mensajero, payment_approved_fraternal, payment_rejected

### Fase 3 — Cartas y PDF (2 semanas)
- [ ] Implementar `PUT /registrations/:id/carta` (upload a Firebase Storage vía URL firmada)
- [ ] Portal: sección de upload de carta (solo mensajeros, solo cuando status === carta_pending | carta_rejected)
- [ ] Admin: approveCarta y rejectCarta endpoints + UI con preview de carta
- [ ] Implementar `generateNominationSheet` (pdf-lib + qrcode)
- [ ] Integrar generación de PDF en el flujo post-aprobación
- [ ] Upload PDF a Firebase Storage
- [ ] Email: fully_approved con PDF adjunto
- [ ] Portal: botón de descarga de hoja de nombramiento

### Fase 4 — Admin Panel Completo (1.5 semanas)
- [ ] Admin: dashboard de estadísticas (totales, por tipo, por estado, revenue)
- [ ] Admin: exportación CSV y Excel (usando xlsx)
- [ ] Admin: gestión de excepciones de cupo por iglesia
- [ ] Admin: panel de configuración (precio, fechas, campos del formulario)
- [ ] Admin: gestión de cuentas de admins (solo super_admin)
- [ ] Admin: toggle de efectivo en sitio

### Fase 5 — Check-in (1 semana)
- [ ] Implementar `GET /admin/checkin/validate/:qrToken`
- [ ] Implementar `POST /admin/registrations/:id/checkin`
- [ ] Admin: página de check-in optimizada para móvil (PWA)
- [ ] Integrar html5-qrcode o ZXing para escaneo de QR
- [ ] UI de resultado: verde (válido), rojo (inválido), amarillo (ya escaneado)
- [ ] Configurar PWA manifest + service worker básico

### Fase 6 — QA y Lanzamiento (1 semana)
- [ ] Pruebas de flujo completo end-to-end (mensajero y fraternal)
- [ ] Pruebas de carga (Artillery o k6) — objetivo: 100 usuarios concurrentes
- [ ] Revisar Firebase Storage rules
- [ ] Revisar validaciones de Stripe webhook
- [ ] Revisar rate limiting en endpoints públicos
- [ ] Setup de alertas CloudWatch (errores Lambda, timeouts)
- [ ] Variables de entorno producción en Amplify y Serverless
- [ ] DNS final: CNAME Hostinger → Amplify
- [ ] Prueba con personal de la convención (UAT)
- [ ] Lanzamiento

---

## 15. Consideraciones de Seguridad

| Riesgo | Mitigación |
|--------|-----------|
| Acceso no autorizado al portal personal | Token UUID v4 de 90 días, validado en cada request |
| Race condition en cupos de iglesia | Transacción Firestore para claim de mensajero |
| Webhooks falsos de Stripe | Validación de firma `stripe.webhooks.constructEvent` |
| Acceso a cartas/PDFs de otros | Storage solo vía Admin SDK, URLs firmadas con expiración |
| Admin sin permisos accede a super_admin | Role verificado en middleware, no en cliente |
| Registro masivo (spam) | Rate limiting: 5 registros/hora por IP en `POST /registrations` |
| OXXO no pagado ocupa cupo | El cupo de mensajero se cuenta al registrarse, no al pagar — esto es intencional para reservar el lugar |
