import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const templatesPath = path.join(__dirname, '..', 'templates');
const baseTemplate = path.join(templatesPath, 'base');
const plenariasTemplate = path.join(templatesPath, 'archetypes', 'plenarias');

// Archivos y carpetas específicos de plenarias que eliminaremos de la base
const PLENARIAS_SPECIFIC_PATHS = [
  'packages/api/src/handlers/churches',
  'packages/api/src/handlers/registrations/carta-submit.ts',
  'packages/api/src/handlers/registrations/carta-upload-url.ts',
  'packages/api/src/lib/corporateDb.ts',
  'apps/portal/src/components/registro/Step1Iglesia.tsx',
  'apps/admin/src/app/(dashboard)/configuracion/iglesias',
  'docs',
];

const srcProject = '/Users/raulcanul/Documents/Dev/registro-plenarias';
const IGNORE_LIST = [
  '.git',
  'node_modules',
  '.next',
  '.serverless',
  '.esbuild',
  'pnpm-lock.yaml',
  'CLAUDE.md',
  '.env.local',
  '.env'
];

async function splitMonorepo() {
  console.log('🧹 Limpiando y repoblando plantilla de plenarias desde el proyecto origen...');
  await fs.remove(plenariasTemplate);
  await fs.ensureDir(plenariasTemplate);
  await fs.copy(srcProject, plenariasTemplate, {
    filter: (src) => {
      const relativePath = path.relative(srcProject, src);
      const parts = relativePath.split(path.sep);
      const shouldIgnore = parts.some(part => IGNORE_LIST.includes(part));
      return !shouldIgnore;
    }
  });

  console.log('🧹 Preparando directorio base...');
  await fs.ensureDir(baseTemplate);

  console.log('📦 Copiando monorepo fresco encima de la carpeta base...');
  // Nota: Copiamos encima de la base sin borrarla para preservar las plantillas .ejs creadas a mano
  await fs.copy(plenariasTemplate, baseTemplate, {
    overwrite: true,
  });

  console.log('🗑️ Eliminando archivos específicos de plenarias de la carpeta base...');
  for (const relativePath of PLENARIAS_SPECIFIC_PATHS) {
    const fullPath = path.join(baseTemplate, relativePath);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
      console.log(`  • Eliminado de la base: ${relativePath}`);
    }
  }

  console.log('📦 Moviendo archivos exclusivos de plenarias a su arquetipo...');
  const pathsToMove = [
    { src: 'packages/api/src/handlers/admin/update-carta.ts', dest: 'packages/api/src/handlers/admin/update-carta.ts' },
    { src: 'packages/api/src/handlers/admin/update-delegate-type.ts', dest: 'packages/api/src/handlers/admin/update-delegate-type.ts' },
    { src: 'packages/api/src/handlers/admin/exceptions.ts', dest: 'packages/api/src/handlers/admin/exceptions.ts' },
    { src: 'packages/api/src/handlers/registrations/create.ts', dest: 'packages/api/src/handlers/registrations/create.ts' },
  ];

  for (const item of pathsToMove) {
    const srcPath = path.join(baseTemplate, item.src);
    const destPath = path.join(plenariasTemplate, item.dest);
    
    if (await fs.pathExists(srcPath)) {
      await fs.ensureDir(path.dirname(destPath));
      await fs.move(srcPath, destPath, { overwrite: true });
      console.log(`  • Movido al arquetipo: ${item.src}`);
    }
  }

  console.log('🗑️ Eliminando archivos estáticos comunes reemplazados por EJS...');
  const staticFilesToDelete = [
    'packages/api/serverless.yml',
    'packages/api/src/handlers/admin/update-payment.ts',
    'packages/api/src/handlers/payments/webhook.ts',
    'packages/api/src/handlers/registrations/create.ts',
    'packages/api/src/lib/email-html.ts',
    'packages/shared/src/types/registration.ts',
    'packages/shared/src/constants.ts',
    'apps/portal/src/components/portal/ActionBlock.tsx',
    'packages/api/src/lib/nomination.ts',
    'packages/api/src/lib/pdf.ts',
    'packages/api/src/handlers/admin/stats.ts',
    'apps/portal/src/components/registro/RegistroFlow.tsx',
    'apps/portal/src/components/registro/Step3Confirmacion.tsx',
    'apps/portal/src/components/registro/StepIndicator.tsx',
    'apps/admin/src/components/admin/Sidebar.tsx',
  ];

  for (const relPath of staticFilesToDelete) {
    const fullPath = path.join(baseTemplate, relPath);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
      console.log(`  • Eliminado redundancia estática: ${relPath}`);
    }
  }

  console.log('📦 Copiando componentes UI genéricos del portal al admin...');
  const portalUiPath = path.join(baseTemplate, 'apps/portal/src/components/ui');
  const adminUiPath = path.join(baseTemplate, 'apps/admin/src/components/ui');
  if (await fs.pathExists(portalUiPath)) {
    await fs.ensureDir(adminUiPath);
    await fs.copy(portalUiPath, adminUiPath);
    console.log('  • Copiados componentes UI genéricos del portal al admin');
  }

  console.log('✏️ Parametrizando archivos de la carpeta base con EJS...');
  await parameterizeBaseFiles();

  console.log('🧹 Limpiando archivos redundantes del arquetipo "plenarias"...');
  await removeRedundantPlenariasFiles();

  // Eliminar archivos de plenarias que tienen inyecciones/correcciones dinámicas en la base
  // para evitar que sobrescriban las versiones corregidas de la base.
  const plenariasRedundantFiles = [
    'packages/api/src/lib/auth.ts',
    'apps/admin/src/lib/firebase.ts',
    'apps/portal/src/lib/firebase.ts',
    'apps/admin/src/app/(dashboard)/registros/[id]/page.tsx',
    'apps/portal/src/components/portal/InfoCard.tsx',
    'apps/portal/src/lib/api.ts'
  ];

  for (const relPath of plenariasRedundantFiles) {
    const fullPath = path.join(plenariasTemplate, relPath);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
      console.log(`  • Eliminado archivo redundante de plenarias: ${relPath}`);
    }
  }

  console.log('✅ Separación del monorepo completada.');
}

/**
 * Reemplaza valores estáticos en la carpeta base por etiquetas EJS para que sean renderizados dinámicamente
 */
async function parameterizeBaseFiles() {
  // 1. Parametrizar package.json raíz del monorepo
  const rootPkgPath = path.join(baseTemplate, 'package.json');
  if (await fs.pathExists(rootPkgPath)) {
    const pkg = await fs.readJson(rootPkgPath);
    pkg.name = '<%= projectName %>';
    pkg.description = 'Registration platform generated for <%= eventName %>';
    await fs.writeJson(rootPkgPath + '.ejs', pkg, { spaces: 2 });
    await fs.remove(rootPkgPath);
    console.log('  • Parametrizado package.json a package.json.ejs');
  }

  // 2. Parametrizar apps/portal/src/app/layout.tsx (Title & next-intl)
  const portalLayoutPath = path.join(baseTemplate, 'apps/portal/src/app/layout.tsx');
  if (await fs.pathExists(portalLayoutPath)) {
    const content = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
<% if (languages === 'es-en') { %>
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import '../globals.css'
<% } else { %>
import './globals.css'
<% } %>

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: '<%= eventName %>',
  description: 'Plataforma de registro para <%= eventName %>',
}

<% if (languages === 'es-en') { %>
export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={inter.variable}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
<% } else { %>
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.variable}>{children}</body>
    </html>
  )
}
<% } %>
`;
    await fs.writeFile(portalLayoutPath + '.ejs', content, 'utf8');
    await fs.remove(portalLayoutPath);
    console.log('  • Parametrizado layout.tsx a layout.tsx.ejs');
  }

  // 3. Parametrizar README.md
  const readmePath = path.join(baseTemplate, 'README.md');
  if (await fs.pathExists(readmePath)) {
    await fs.rename(readmePath, readmePath + '.ejs');
    console.log('  • Renombrado README.md a README.md.ejs');
  }

  // 4. Parametrizar apps/portal/next.config.ts
  const portalConfigPath = path.join(baseTemplate, 'apps/portal/next.config.ts');
  if (await fs.pathExists(portalConfigPath)) {
    const configContent = `import type { NextConfig } from 'next'
<% if (languages === 'es-en') { %>
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()
<% } %>

const nextConfig: NextConfig = {
  transpilePackages: ['@plenarias/shared'],
}

export default <% if (languages === 'es-en') { %>withNextIntl(<% } %>nextConfig<% if (languages === 'es-en') { %>)<% } %>
`;
    await fs.writeFile(portalConfigPath + '.ejs', configContent, 'utf8');
    await fs.remove(portalConfigPath);
    console.log('  • Parametrizado next.config.ts a next.config.ts.ejs');
  }

  // 5. Parametrizar packages/api/src/handlers/admin/checkin.ts
  const checkinPath = path.join(baseTemplate, 'packages/api/src/handlers/admin/checkin.ts');
  if (await fs.pathExists(checkinPath)) {
    const checkinContent = `import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getFirebase } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, badRequest, notFound, serverError } from '../../lib/response'
import type { Registration, CheckInResult } from '@plenarias/shared'

const schema = z.object({
  qrToken: z.string().uuid(),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('qrToken inválido')

  const { qrToken } = parsed.data

  try {
    const db = getFirebase().firestore()

    const snap = await db
      .collection('registrations')
      .where('qrToken', '==', qrToken)
      .limit(1)
      .get()

    if (snap.empty) {
      const result: CheckInResult = { status: 'invalid' }
      return ok(result)
    }

    const docRef = snap.docs[0]!.ref
    const reg = snap.docs[0]!.data() as Registration

    if (reg.status === 'checked_in') {
      const result: CheckInResult = {
        status: 'already_scanned',
        registration: {
          fullName: reg.fullName,
          <% if (archetype === 'plenarias') { %>
          churchName: reg.churchName,
          delegateType: reg.delegateType,
          <% } %>
          checkedInAt: reg.checkedInAt,
          checkedInBy: reg.checkedInBy,
        },
      }
      return ok(result)
    }

    if (reg.status !== 'fully_approved') {
      const result: CheckInResult = { status: 'invalid' }
      return ok(result)
    }

    const now = new Date().toISOString()
    await docRef.update({
      status: 'checked_in',
      checkedInAt: now,
      checkedInBy: admin.email,
      updatedAt: now,
    })

    const result: CheckInResult = {
      status: 'valid',
      registration: {
        fullName: reg.fullName,
        <% if (archetype === 'plenarias') { %>
        churchName: reg.churchName,
        delegateType: reg.delegateType,
        <% } %>
        checkedInAt: now,
        checkedInBy: admin.email,
      },
    }
    return ok(result)
  } catch (err) {
    console.error('checkin error', err)
    return serverError()
  }
}
`;
    await fs.writeFile(checkinPath + '.ejs', checkinContent, 'utf8');
    await fs.remove(checkinPath);
    console.log('  • Parametrizado checkin.ts a checkin.ts.ejs');
  }

  // 6. Parametrizar packages/api/src/handlers/admin/export.ts
  const exportPath = path.join(baseTemplate, 'packages/api/src/handlers/admin/export.ts');
  if (await fs.pathExists(exportPath)) {
    const exportContent = `import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { serverError } from '../../lib/response'
import type { Registration } from '@plenarias/shared'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  payment_submitted: 'Pago en proceso',
  payment_approved: 'Pago aprobado',
  payment_rejected: 'Pago rechazado',
  carta_pending: 'Carta pendiente',
  carta_submitted: 'Carta enviada',
  carta_rejected: 'Carta rechazada',
  fully_approved: 'Aprobado',
  checked_in: 'Check-in realizado',
  pending_onsite_payment: 'Pago en sitio pendiente',
}

function escapeCsv(val: unknown): string {
  const str = val === undefined || val === null ? '' : String(val)
  return str.includes(',') || str.includes('"') || str.includes('\\n')
    ? \`"\${str.replace(/"/g, '""')}"\`
    : str
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  try {
    const db = getDb()
    const snap = await db.collection('registrations').orderBy('createdAt', 'desc').get()
    const registrations = snap.docs.map((d) => d.data() as Registration)

    const headers = [
      'Nombre', 'Correo', 'Teléfono', 'Fecha de nacimiento', 'Edad',
      <% if (archetype === 'plenarias') { %>
      'Iglesia', 'Convención', 'Tipo de delegado',
      <% } else if (archetype === 'roles') { %>
      'Entrada',
      <% } %>
      'Estado', 'Método de pago', 'Monto', 'Pago aprobado', 'Registro creado',
    ]

    const rows = registrations.map((r) => [
      escapeCsv(r.fullName),
      escapeCsv(r.email),
      escapeCsv(r.phone),
      escapeCsv(r.birthDate),
      escapeCsv(r.age),
      <% if (archetype === 'plenarias') { %>
      escapeCsv(r.churchName),
      escapeCsv(r.conventionName),
      escapeCsv(r.delegateType === 'mensajero_acreditado' ? 'Mensajero Acreditado' : r.delegateType === 'fraternal' ? 'Fraternal' : 'Sin asignar'),
      <% } else if (archetype === 'roles') { %>
      escapeCsv(r.ticketTier === 'vip' ? 'VIP' : r.ticketTier === 'student' ? 'Estudiante' : 'General'),
      <% } %>
      escapeCsv(STATUS_LABELS[r.status] ?? r.status),
      escapeCsv(r.paymentMethod ?? ''),
      escapeCsv(r.paymentAmount ?? ''),
      escapeCsv(r.paymentApprovedAt ?? ''),
      escapeCsv(r.createdAt),
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\\n')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="registros.csv"',
        'Access-Control-Allow-Origin': '*',
      },
      body: csv,
    }
  } catch (err) {
    console.error('export error:', err)
    return serverError()
  }
}
`;
    await fs.writeFile(exportPath + '.ejs', exportContent, 'utf8');
    await fs.remove(exportPath);
    console.log('  • Parametrizado export.ts a export.ts.ejs');
  }

  // 7. Parametrizar packages/api/src/handlers/admin/list-registrations.ts
  const listRegPath = path.join(baseTemplate, 'packages/api/src/handlers/admin/list-registrations.ts');
  if (await fs.pathExists(listRegPath)) {
    let content = await fs.readFile(listRegPath, 'utf8');
    content = content.replace(/r\.churchName\.toLowerCase\(\)\.includes\(search\)/g, "<% if (archetype === 'plenarias') { %>r.churchName?.toLowerCase().includes(search)<% } else { %>false<% } %>");
    await fs.writeFile(listRegPath + '.ejs', content, 'utf8');
    await fs.remove(listRegPath);
    console.log('  • Parametrizado list-registrations.ts a list-registrations.ts.ejs');
  }

  // 8. Parametrizar packages/api/src/handlers/payments/create-intent.ts
  const createIntentPath = path.join(baseTemplate, 'packages/api/src/handlers/payments/create-intent.ts');
  if (await fs.pathExists(createIntentPath)) {
    let content = await fs.readFile(createIntentPath, 'utf8');
    content = content.replace(/churchName: registration\.churchName,/g, "<% if (archetype === 'plenarias') { %>\n        churchName: registration.churchName || '',\n        <% } %>");
    await fs.writeFile(createIntentPath + '.ejs', content, 'utf8');
    await fs.remove(createIntentPath);
    console.log('  • Parametrizado create-intent.ts a create-intent.ts.ejs');
  }

  // 9. Inyectar verifyRegistrantToken en packages/api/src/lib/auth.ts
  const authLibPath = path.join(baseTemplate, 'packages/api/src/lib/auth.ts');
  if (await fs.pathExists(authLibPath)) {
    const authContent = `import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { getFirebase, getDb } from './firebase'

export interface AdminUser {
  uid: string
  email: string
  role: 'admin' | 'super_admin'
}

export async function verifyAdminToken(event: APIGatewayProxyEventV2): Promise<AdminUser | null> {
  const authHeader = event.headers['authorization'] ?? event.headers['Authorization'] ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  try {
    const decoded = await getFirebase().auth().verifyIdToken(token)
    const role = decoded['role'] as string | undefined
    if (role !== 'admin' && role !== 'super_admin') return null
    return { uid: decoded.uid, email: decoded.email ?? '', role: role as AdminUser['role'] }
  } catch {
    return null
  }
}

export async function verifyRegistrantToken(event: APIGatewayProxyEventV2): Promise<any | null> {
  const authHeader = event.headers['authorization'] ?? event.headers['Authorization'] ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  try {
    const db = getDb()
    const snap = await db
      .collection('registrations')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (snap.empty) return null

    const doc = snap.docs[0]
    if (!doc) return null
    return { id: doc.id, ...doc.data() }
  } catch {
    return null
  }
}
`;
    await fs.writeFile(authLibPath, authContent, 'utf8');
    console.log('  • Inyectada verifyRegistrantToken en auth.ts');
  }

  // 10. Parametrizar apps/admin/src/lib/firebase.ts
  const adminFirebasePath = path.join(baseTemplate, 'apps/admin/src/lib/firebase.ts');
  if (await fs.pathExists(adminFirebasePath)) {
    let content = await fs.readFile(adminFirebasePath, 'utf8');
    if (!content.includes('getFirestore')) {
      content = "import { getFirestore } from 'firebase/firestore'\n" + content;
      content += "\nexport const db = getFirestore(app)\n";
      await fs.writeFile(adminFirebasePath, content, 'utf8');
      console.log('  • Inyectado getFirestore en apps/admin/src/lib/firebase.ts');
    }
  }

  // 11. Corregir fallbacks de tipos en apps/admin/src/app/(dashboard)/registros/[id]/page.tsx
  const adminRegistrosIdPath = path.join(baseTemplate, 'apps/admin/src/app/(dashboard)/registros/[id]/page.tsx');
  if (await fs.pathExists(adminRegistrosIdPath)) {
    let content = await fs.readFile(adminRegistrosIdPath, 'utf8');
    content = content.replace(
      'value={reg.conventionCode ? `${reg.conventionName} · ${reg.conventionCode}` : reg.conventionName}',
      "value={reg.conventionCode ? `${reg.conventionName} · ${reg.conventionCode}` : (reg.conventionName || '—')}"
    );
    content = content.replace(
      'value={reg.churchCode ? `${reg.churchName} · ${reg.churchCode}` : reg.churchName}',
      "value={reg.churchCode ? `${reg.churchName} · ${reg.churchCode}` : (reg.churchName || '—')}"
    );
    await fs.writeFile(adminRegistrosIdPath, content, 'utf8');
    console.log('  • Corregidos fallbacks de tipo en la página de detalle de registro en admin');
  }

  // 12. Parametrizar apps/portal/src/lib/firebase.ts
  const portalFirebasePath = path.join(baseTemplate, 'apps/portal/src/lib/firebase.ts');
  if (await fs.pathExists(portalFirebasePath)) {
    let content = await fs.readFile(portalFirebasePath, 'utf8');
    if (!content.includes('getFirestore')) {
      content = "import { getFirestore } from 'firebase/firestore'\n" + content;
      content += "\nexport const db = getFirestore(app)\n";
      await fs.writeFile(portalFirebasePath, content, 'utf8');
      console.log('  • Inyectado getFirestore en apps/portal/src/lib/firebase.ts');
    }
  }

  // 13. Parametrizar apps/portal/src/lib/api.ts (CreateRegistrationInput)
  const portalApiPath = path.join(baseTemplate, 'apps/portal/src/lib/api.ts');
  if (await fs.pathExists(portalApiPath)) {
    let content = await fs.readFile(portalApiPath, 'utf8');
    
    // Hacemos que los campos específicos de plenarias sean opcionales y agregamos ticketTier
    const oldInterface = `export interface CreateRegistrationInput {
  // Convención
  conventionId: string
  conventionName: string
  conventionCode: string
  conventionNotListed?: boolean
  conventionNotListedName?: string
  // Iglesia
  churchId: string
  churchName: string
  churchCode: string | null
  churchNotListed?: boolean
  churchNotListedName?: string
  // Datos personales
  fullName: string
  email: string
  phone: string
  birthDate: string
  extraFields?: Record<string, string>
}`;

    const newInterface = `export interface CreateRegistrationInput {
  // Convención
  conventionId?: string
  conventionName?: string
  conventionCode?: string
  conventionNotListed?: boolean
  conventionNotListedName?: string
  // Iglesia
  churchId?: string
  churchName?: string
  churchCode?: string | null
  churchNotListed?: boolean
  churchNotListedName?: string
  // Entrada (Roles)
  ticketTier?: 'general' | 'student' | 'vip'
  // Datos personales
  fullName: string
  email: string
  phone: string
  birthDate: string
  extraFields?: Record<string, string>
}`;

    if (content.includes(oldInterface)) {
      content = content.replace(oldInterface, newInterface);
      await fs.writeFile(portalApiPath, content, 'utf8');
      console.log('  • Parametrizada interface CreateRegistrationInput en apps/portal/src/lib/api.ts');
    } else {
      // Intento de fallback más tolerante por si acaso cambian espaciados/formato
      content = content.replace(
        /conventionId:\s*string/g,
        "conventionId?: string\\n  conventionName?: string\\n  conventionCode?: string\\n  ticketTier?: 'general' | 'student' | 'vip'"
      );
      content = content.replace(/conventionName:\s*string/g, '');
      content = content.replace(/conventionCode:\s*string/g, '');
      content = content.replace(/churchId:\s*string/g, 'churchId?: string');
      content = content.replace(/churchName:\s*string/g, 'churchName?: string');
      content = content.replace(/churchCode:\s*string\s*\|\s*null/g, 'churchCode?: string | null');
      await fs.writeFile(portalApiPath, content, 'utf8');
      console.log('  • Parametrizada interface CreateRegistrationInput en apps/portal/src/lib/api.ts (fallback regex)');
    }
  }

  // 14. Corregir fallbacks de tipos en apps/portal/src/components/portal/InfoCard.tsx
  const portalInfoCardPath = path.join(baseTemplate, 'apps/portal/src/components/portal/InfoCard.tsx');
  if (await fs.pathExists(portalInfoCardPath)) {
    let content = await fs.readFile(portalInfoCardPath, 'utf8');
    content = content.replace(
      '<Row label="Iglesia" value={registration.churchName} />',
      "<Row label=\"Iglesia\" value={registration.churchName || '—'} />"
    );
    content = content.replace(
      '<Row label="Convención" value={registration.conventionName} />',
      "<Row label=\"Convención\" value={registration.conventionName || '—'} />"
    );
    await fs.writeFile(portalInfoCardPath, content, 'utf8');
    console.log('  • Corregidos fallbacks de tipo en InfoCard del portal');
  }
}

/**
 * Recorre recursivamente el arquetipo de plenarias y elimina cualquier archivo que sea
 * idéntico al que está en la carpeta base, para evitar duplicación.
 */
async function removeRedundantPlenariasFiles() {
  const compareAndCleanup = async (currentDir) => {
    const files = await fs.readdir(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const relativePath = path.relative(plenariasTemplate, fullPath);
      const baseEquivalent = path.join(baseTemplate, relativePath);
      
      const stat = await fs.lstat(fullPath);
      
      if (stat.isDirectory()) {
        await compareAndCleanup(fullPath);
        const remaining = await fs.readdir(fullPath);
        if (remaining.length === 0) {
          await fs.remove(fullPath);
        }
      } else if (stat.isSymbolicLink()) {
        if (await fs.pathExists(baseEquivalent)) {
          await fs.remove(fullPath);
        }
      } else {
        if (await fs.pathExists(baseEquivalent)) {
          const fileContent = await fs.readFile(fullPath);
          const baseContent = await fs.readFile(baseEquivalent);
          
          if (fileContent.equals(baseContent)) {
            await fs.remove(fullPath);
          }
        }
      }
    }
  };

  await compareAndCleanup(plenariasTemplate);
}

splitMonorepo().catch(err => {
  console.error('❌ Error separando monorepo:', err);
  process.exit(1);
});
