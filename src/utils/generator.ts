import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import picocolors from 'picocolors';

export interface GeneratorOptions {
  projectName: string;
  eventName: string;
  archetype: 'standard' | 'roles' | 'plenarias';
  modules: string[];
  languages: 'es-en' | 'es';
}

interface RenderOptions extends GeneratorOptions {
  moduleEndpointsYaml: string;
}

/** Deriva iniciales (máx. 3) a partir del nombre del evento para el monograma. */
function getEventInitials(eventName: string): string {
  return eventName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]!.toUpperCase())
    .join('');
}

/**
 * Función principal encargada de generar la plataforma en el directorio especificado
 */
export async function generateProject(destPath: string, options: GeneratorOptions): Promise<void> {
  let templatesPath = path.join(__dirname, '..', 'templates');
  if (!fs.existsSync(templatesPath)) {
    templatesPath = path.join(__dirname, '..', '..', 'templates');
  }
  const basePath = path.join(templatesPath, 'base');
  const archetypePath = path.join(templatesPath, 'archetypes', options.archetype);

  // 1. Crear directorio destino
  await fs.ensureDir(destPath);

  // 2. Copiar la estructura base del monorepo
  if (await fs.pathExists(basePath)) {
    await fs.copy(basePath, destPath);
  } else {
    // Si no existen plantillas aún (fase inicial), creamos directorios vacíos mínimos
    await createEmptyMonorepoStructure(destPath);
  }

  // 3. Copiar el arquetipo seleccionado
  if (await fs.pathExists(archetypePath)) {
    await fs.copy(archetypePath, destPath, { overwrite: true });
  }

  // 4. Inyectar todos los módulos opcionales para usar Feature Flags
  const availableModules = ['tshirt', 'workshops', 'rooms', 'voting'];
  const moduleEndpointBlocks: string[] = [];
  for (const moduleName of availableModules) {
    const modulePath = path.join(templatesPath, 'modules', moduleName);
    if (await fs.pathExists(modulePath)) {
      const endpointsYaml = await injectModule(modulePath, destPath, options);
      if (endpointsYaml) moduleEndpointBlocks.push(endpointsYaml);
    }
  }

  // 5. Configurar i18n
  await configureI18n(destPath, options);

  // 6. Renderizar plantillas dinámicas (EJS)
  await renderTemplates(destPath, {
    ...options,
    moduleEndpointsYaml: moduleEndpointBlocks.join('\n'),
  });
}

/**
 * Crea una estructura de monorepo inicial si no existen plantillas aún (para propósitos de desarrollo inicial)
 */
async function createEmptyMonorepoStructure(destPath: string): Promise<void> {
  const dirs = [
    'apps/portal/src/app',
    'apps/admin/src/app',
    'packages/api/src/handlers',
    'packages/shared/src/types',
  ];
  for (const dir of dirs) {
    await fs.ensureDir(path.join(destPath, dir));
  }

  // Crear pnpm-workspace.yaml básico
  await fs.writeFile(
    path.join(destPath, 'pnpm-workspace.yaml'),
    "packages:\n  - 'apps/*'\n  - 'packages/*'\n"
  );
}

/**
 * Copia e inyecta archivos de un módulo en el monorepo generado
 */
async function injectModule(modulePath: string, destPath: string, options: GeneratorOptions): Promise<string> {
  // Copiar archivos del módulo respetando la estructura interna del monorepo
  // ej: templates/modules/voting/apps/portal/ -> dest/apps/portal/
  await fs.copy(modulePath, destPath, {
    overwrite: true,
    filter: (src) => {
      // Filtrar archivos de configuración de inyección propios del módulo si los hubiera
      return !src.endsWith('inject-config.json');
    }
  });

  // Aquí podemos añadir lógica para concatenar rutas en serverless.yml o agregar tipos
  return mergeModuleConfigs(modulePath, destPath, options);
}

/**
 * Fusiona configuraciones específicas del módulo (endpoints en serverless.yml, dependencias, etc.)
 */
async function mergeModuleConfigs(modulePath: string, destPath: string, options: GeneratorOptions): Promise<string> {
  // Ejemplo: Inyectar handlers en serverless.yml si existe una configuración de inyección
  const injectConfigPath = path.join(modulePath, 'inject-config.json');
  if (await fs.pathExists(injectConfigPath)) {
    const config = await fs.readJson(injectConfigPath);
    let endpointsYaml = '';
    
    // Inyectar en serverless.yml si es necesario
    if (config.serverless) {
      endpointsYaml = buildServerlessEndpointsYaml(config.serverless);
    }
    
    // Inyectar en package.json de packages/api o apps/portal
    if (config.dependencies) {
      await injectDependencies(destPath, config.dependencies);
    }

    return endpointsYaml;
  }

  return '';
}

/**
 * Genera YAML de Serverless para registrar endpoints de módulos.
 */
function buildServerlessEndpointsYaml(serverlessConfig: any): string {
  let functionsYaml = '  # --- Endpoints Inyectados por Módulo ---\n';
  for (const [funcName, funcConfig] of Object.entries(serverlessConfig.functions || {})) {
    const config = funcConfig as any;
    functionsYaml += `  ${funcName}:\n`;
    functionsYaml += `    handler: ${config.handler}\n`;
    if (config.events && config.events.length > 0) {
      functionsYaml += `    events:\n`;
      for (const event of config.events) {
        if (event.httpApi) {
          functionsYaml += `      - httpApi:\n`;
          functionsYaml += `          path: ${event.httpApi.path}\n`;
          functionsYaml += `          method: ${event.httpApi.method.toUpperCase()}\n`;
        }
      }
    }
  }

  return functionsYaml;
}

/**
 * Añade dependencias a package.json específicos de apps o packages
 */
async function injectDependencies(destPath: string, depsConfig: any): Promise<void> {
  for (const target of Object.keys(depsConfig)) {
    const pkgJsonPath = path.join(destPath, target, 'package.json');
    if (await fs.pathExists(pkgJsonPath)) {
      const pkgJson = await fs.readJson(pkgJsonPath);
      pkgJson.dependencies = {
        ...pkgJson.dependencies,
        ...depsConfig[target],
      };
      await fs.writeJson(pkgJsonPath, pkgJson, { spaces: 2 });
    }
  }
}

/**
 * Configura los archivos de traducción según la opción de i18n
 */
async function configureI18n(destPath: string, options: GeneratorOptions): Promise<void> {
  const portalPath = path.join(destPath, 'apps', 'portal');
  const messagesDir = path.join(portalPath, 'messages');
  await fs.ensureDir(messagesDir);
  
  // Creamos las traducciones base con todos los módulos incluidos por defecto
  const esBase: any = {
    common: {
      title: options.eventName,
      loading: 'Cargando...',
    },
    register: {
      title: 'Formulario de Registro',
      submit: 'Registrarse',
    },
    tshirt: {
      title: 'Playera del Evento',
      subtitle: 'Elige tu talla oficial para el kit de bienvenida',
      chosen: 'Talla de playera elegida',
      confirmed: 'Confirmado',
      selectionText: 'Has seleccionado la talla {size}. Te entregaremos tu playera oficial el día del registro presencial.',
      notAvailable: 'La selección de talla de playera estará disponible una vez que tu pago de inscripción haya sido aprobado.',
      confirmBtn: 'Confirmar Talla',
      loading: 'Cargando módulo de playera...',
      errorSelect: 'Ocurrió un error al guardar tu talla.',
      errorLoad: 'Error al cargar estado de playera'
    },
    workshops: {
      title: 'Selección de Talleres',
      subtitle: 'Elige un taller para cada uno de los días del evento. Puedes cambiar tu selección antes del evento.',
      loading: 'Cargando talleres...',
      noWorkshops: 'No hay talleres disponibles programados para este día.',
      yourSelection: 'Tu Selección:',
      none: 'Ninguno',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      saveBtn: 'Guardar Selección',
      savedTitle: 'Selección Guardada',
      savedSuccess: 'Tu selección de talleres ha sido registrada con éxito.',
      backBtn: 'Volver al portal',
      enroll: 'Inscribirse en este taller',
      selected: 'Taller seleccionado',
      full: 'Cupo completo',
      spacesAvailable: '{count} lugares disponibles',
      presentedBy: 'impartido por',
      errorLoad: 'Error al cargar talleres',
      errorSubmit: 'Error al guardar selección'
    },
    voting: {
      loading: 'Iniciando panel de votación...',
      backBtn: 'Volver al Portal',
      liveTitle: 'Votaciones en Vivo',
      panelTitle: 'Panel de Votación',
      noActive: 'Actualmente no hay ninguna propuesta o votación activa. En cuanto el moderador inicie una votación, esta pantalla se actualizará automáticamente.',
      voteReceived: '¡Voto Recibido!',
      voteSuccessText: 'Tu voto para la propuesta "{title}" ha sido registrado correctamente.',
      waitingResults: 'Esperando resultados en pantalla...',
      closedResultsTitle: 'Resultados cerrados',
      closedResultsEmpty: 'Aún no hay votaciones cerradas para consultar.',
      closedAt: 'Cerrada el {date}',
      totalVotes: '{count} votos totales',
      voteCount: '{count} voto',
      voteCountPlural: '{count} votos',
      winner: 'Opción ganadora',
      tie: 'Empate',
      activeProposal: 'Propuesta Activa',
      submitBtn: 'Emitir Voto',
      errorLoad: 'Error al conectar con la base de datos de votación.',
      errorSubmit: 'Error al registrar tu voto'
    },
    rooms: {
      loading: 'Cargando módulo de hospedaje...',
      title: 'Hospedaje y Habitaciones',
      subtitle: 'Gestiona tu asignación de habitación, crea un grupo nuevo o únete a una habitación existente utilizando un código de invitación.',
      backBtn: 'Volver al portal',
      notAvailable: 'La gestión de hospedaje estará disponible una vez que tu pago haya sido aprobado por los administradores.',
      requestSentTitle: 'Solicitud de Unión Enviada',
      requestSentText: 'Has solicitado unirte a la habitación creada por {name}.',
      requestPendingText: 'Tu solicitud está pendiente de aprobación por parte del responsable.',
      cancelRequestBtn: 'Cancelar Solicitud',
      myRoomTitle: 'Mi Habitación',
      inviteCode: 'Código de Invitación:',
      roomType: 'Tipo:',
      genderFilter: 'Género:',
      capacity: 'Capacidad:',
      members: 'Integrantes',
      roleResponsible: 'Responsable',
      roleGuest: 'Invitado',
      pendingRequests: 'Solicitudes de Unión Pendientes',
      acceptBtn: 'Aceptar',
      rejectBtn: 'Rechazar',
      leaveBtn: 'Salir de la habitación',
      createRoomTitle: 'Crear Habitación Nueva',
      roomNameLabel: 'Nombre del grupo / Habitación:',
      roomNamePlaceholder: 'Nombre descriptivo (ej. "Familia Gómez" o "Jóvenes Iglesia")',
      roomTypeLabel: 'Tipo de Habitación:',
      genderFilterLabel: 'Filtro de Género:',
      genderMen: 'Solo Hombres',
      genderWomen: 'Solo Mujeres',
      genderMixed: 'Mixto',
      createBtn: 'Crear Habitación',
      joinRoomTitle: 'Unirse a una Habitación',
      joinRoomText: 'Introduce el código de invitación que te proporcionó el responsable del grupo.',
      joinCodeLabel: 'Código de invitación:',
      joinBtn: 'Enviar Solicitud de Unión',
      errorLoad: 'Error al cargar estado de hospedaje',
      errorConnection: 'Error de conexión. Intenta de nuevo.'
    }
  };

  const enBase: any = {
    common: {
      title: options.eventName,
      loading: 'Loading...',
    },
    register: {
      title: 'Registration Form',
      submit: 'Register',
    },
    tshirt: {
      title: 'Event T-Shirt',
      subtitle: 'Choose your official size for the welcome kit',
      chosen: 'T-shirt size chosen',
      confirmed: 'Confirmed',
      selectionText: 'You have selected size {size}. We will deliver your official t-shirt on the day of in-person registration.',
      notAvailable: 'T-shirt size selection will be available once your registration payment has been approved.',
      confirmBtn: 'Confirm Size',
      loading: 'Loading t-shirt module...',
      errorSelect: 'An error occurred while saving your size.',
      errorLoad: 'Error loading t-shirt status'
    },
    workshops: {
      title: 'Workshops Selection',
      subtitle: 'Choose a workshop for each day of the event. You can change your selection before the event.',
      loading: 'Loading workshops...',
      noWorkshops: 'No workshops available scheduled for this day.',
      yourSelection: 'Your Selection:',
      none: 'None',
      martes: 'Tuesday',
      miercoles: 'Wednesday',
      jueves: 'Thursday',
      saveBtn: 'Save Selection',
      savedTitle: 'Selection Saved',
      savedSuccess: 'Your workshop selection has been registered successfully.',
      backBtn: 'Back to portal',
      enroll: 'Enroll in this workshop',
      selected: 'Selected workshop',
      full: 'Fully booked',
      spacesAvailable: '{count} spaces available',
      presentedBy: 'presented by',
      errorLoad: 'Error loading workshops',
      errorSubmit: 'Error saving selection'
    },
    voting: {
      loading: 'Starting voting panel...',
      backBtn: 'Back to Portal',
      liveTitle: 'Live Voting',
      panelTitle: 'Voting Panel',
      noActive: 'Currently there is no active proposal or vote. As soon as the moderator starts a vote, this screen will update automatically.',
      voteReceived: 'Vote Received!',
      voteSuccessText: 'Your vote for proposal "{title}" has been registered successfully.',
      waitingResults: 'Waiting for results on screen...',
      closedResultsTitle: 'Closed results',
      closedResultsEmpty: 'There are no closed votes to review yet.',
      closedAt: 'Closed on {date}',
      totalVotes: '{count} total votes',
      voteCount: '{count} vote',
      voteCountPlural: '{count} votes',
      winner: 'Winning option',
      tie: 'Tie',
      activeProposal: 'Active Proposal',
      submitBtn: 'Submit Vote',
      errorLoad: 'Error connecting to voting database.',
      errorSubmit: 'Error registering your vote'
    },
    rooms: {
      loading: 'Loading lodging module...',
      title: 'Lodging & Rooms',
      subtitle: 'Manage your room assignment, create a new group, or join an existing room using an invitation code.',
      backBtn: 'Back to portal',
      notAvailable: 'Lodging management will be available once your payment has been approved by the administrators.',
      requestSentTitle: 'Join Request Sent',
      requestSentText: 'You have requested to join the room created by {name}.',
      requestPendingText: 'Your request is pending approval by the responsible person.',
      cancelRequestBtn: 'Cancel Request',
      myRoomTitle: 'My Room',
      inviteCode: 'Invitation Code:',
      roomType: 'Type:',
      genderFilter: 'Gender:',
      capacity: 'Capacity:',
      members: 'Members',
      roleResponsible: 'Responsible',
      roleGuest: 'Guest',
      pendingRequests: 'Pending Join Requests',
      acceptBtn: 'Accept',
      rejectBtn: 'Reject',
      leaveBtn: 'Leave room',
      createRoomTitle: 'Create New Room',
      roomNameLabel: 'Group / Room Name:',
      roomNamePlaceholder: 'Descriptive name (e.g. "Gomez Family" or "Church Youth")',
      roomTypeLabel: 'Room Type:',
      genderFilterLabel: 'Gender Filter:',
      genderMen: 'Men Only',
      genderWomen: 'Women Only',
      genderMixed: 'Mixed',
      createBtn: 'Create Room',
      joinRoomTitle: 'Join a Room',
      joinRoomText: 'Enter the invitation code provided by the group manager.',
      joinCodeLabel: 'Invitation code:',
      joinBtn: 'Send Join Request',
      errorLoad: 'Error loading lodging status',
      errorConnection: 'Connection error. Try again.'
    }
  };

  const esPath = path.join(messagesDir, 'es.json');
  await fs.writeJson(esPath, esBase, { spaces: 2 });

  if (options.languages === 'es-en') {
    const enPath = path.join(messagesDir, 'en.json');
    await fs.writeJson(enPath, enBase, { spaces: 2 });

    // 1. Añadir dependencia next-intl en package.json del portal
    const portalPkgPath = path.join(portalPath, 'package.json');
    if (await fs.pathExists(portalPkgPath)) {
      const pkg = await fs.readJson(portalPkgPath);
      pkg.dependencies = {
        ...pkg.dependencies,
        "next-intl": "^3.25.1"
      };
      await fs.writeJson(portalPkgPath, pkg, { spaces: 2 });
    }

    // 2. Mover archivos de app/ a app/[locale]/
    const appDir = path.join(portalPath, 'src', 'app');
    const localeDir = path.join(appDir, '[locale]');
    await fs.ensureDir(localeDir);

    // Mover portal, registro, layout.tsx.ejs, page.tsx a [locale]/
    const itemsToMove = ['portal', 'registro', 'layout.tsx.ejs', 'page.tsx'];
    for (const item of itemsToMove) {
      const srcItem = path.join(appDir, item);
      const destItem = path.join(localeDir, item);
      if (await fs.pathExists(srcItem)) {
        await fs.move(srcItem, destItem, { overwrite: true });
      }
    }

    // 3. Crear archivo de layout raíz en app/layout.tsx
    const rootLayoutContent = `import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ThemeProvider } from 'next-themes'
import { branding, hexToRgbTriplet } from '@unbj/shared'
import './globals.css'

const accentStyle = \`:root{--accent:\${hexToRgbTriplet(branding.accentColor)};--accent-hover:\${hexToRgbTriplet(branding.accentHoverColor)}}\`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={\`\${GeistSans.variable} \${GeistMono.variable}\`}>
        <style dangerouslySetInnerHTML={{ __html: accentStyle }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
`;
    await fs.writeFile(path.join(appDir, 'layout.tsx'), rootLayoutContent, 'utf8');

    // 4. Crear aliases sin locale para las rutas principales del portal.
    const registroDir = path.join(appDir, 'registro');
    const registroCompletadoDir = path.join(registroDir, 'completado');
    const portalAliasDir = path.join(appDir, 'portal', '[token]');
    const portalRoomsAliasDir = path.join(portalAliasDir, 'habitaciones');
    const portalWorkshopsAliasDir = path.join(portalAliasDir, 'talleres');
    const portalVotingAliasDir = path.join(portalAliasDir, 'votacion');
    await fs.ensureDir(registroCompletadoDir);
    await fs.ensureDir(portalAliasDir);
    await fs.ensureDir(portalRoomsAliasDir);
    await fs.ensureDir(portalWorkshopsAliasDir);
    await fs.ensureDir(portalVotingAliasDir);

    const rootPageContent = `import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/es/registro')
}
`;
    await fs.writeFile(path.join(appDir, 'page.tsx'), rootPageContent, 'utf8');

    const registroAliasContent = `import { redirect } from 'next/navigation'

export default function RegistroAliasPage() {
  redirect('/es/registro')
}
`;
    await fs.writeFile(path.join(registroDir, 'page.tsx'), registroAliasContent, 'utf8');

    const registroDoneAliasContent = `import { redirect } from 'next/navigation'

export default function RegistroCompletadoAliasPage() {
  redirect('/es/registro/completado')
}
`;
    await fs.writeFile(path.join(registroCompletadoDir, 'page.tsx'), registroDoneAliasContent, 'utf8');

    const portalAliasContent = `import { redirect } from 'next/navigation'

export default async function PortalAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}\`)
}
`;
    await fs.writeFile(path.join(portalAliasDir, 'page.tsx'), portalAliasContent, 'utf8');

    const portalRoomsAliasContent = `import { redirect } from 'next/navigation'

export default async function PortalHabitacionesAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}/habitaciones\`)
}
`;
    await fs.writeFile(path.join(portalRoomsAliasDir, 'page.tsx'), portalRoomsAliasContent, 'utf8');

    const portalWorkshopsAliasContent = `import { redirect } from 'next/navigation'

export default async function PortalTalleresAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}/talleres\`)
}
`;
    await fs.writeFile(path.join(portalWorkshopsAliasDir, 'page.tsx'), portalWorkshopsAliasContent, 'utf8');

    const portalVotingAliasContent = `import { redirect } from 'next/navigation'

export default async function PortalVotacionAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}/votacion\`)
}
`;
    await fs.writeFile(path.join(portalVotingAliasDir, 'page.tsx'), portalVotingAliasContent, 'utf8');

    // 5. Crear archivos de configuración de next-intl en src/
    const srcDir = path.join(portalPath, 'src');
    const i18nDir = path.join(srcDir, 'i18n');
    await fs.ensureDir(i18nDir);
    
    const routingContent = `import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es'
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
`;
    await fs.writeFile(path.join(i18nDir, 'routing.ts'), routingContent, 'utf8');

    const requestContent = `import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(\`../../messages/\${locale}.json\`)).default
  }
})
`;
    await fs.writeFile(path.join(i18nDir, 'request.ts'), requestContent, 'utf8');

    const middlewareContent = `import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
`;
    await fs.writeFile(path.join(srcDir, 'middleware.ts'), middlewareContent, 'utf8');
  }
}

/**
 * Procesa todos los archivos terminados en .ejs en el directorio de destino
 */
async function renderTemplates(destPath: string, options: RenderOptions): Promise<void> {
  const renderDir = async (dir: string) => {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await renderDir(fullPath);
      } else if (file.endsWith('.ejs')) {
        const content = await fs.readFile(fullPath, 'utf8');
        const rendered = ejs.render(content, {
          projectName: options.projectName,
          eventName: options.eventName,
          initials: getEventInitials(options.eventName),
          archetype: options.archetype,
          languages: options.languages,
          modules: options.modules,
          moduleEndpointsYaml: options.moduleEndpointsYaml,
        });

        // Escribir el archivo sin la extensión .ejs
        const targetPath = fullPath.substring(0, fullPath.length - 4);
        await fs.writeFile(targetPath, rendered, 'utf8');
        await fs.remove(fullPath); // Eliminar la plantilla original
      }
    }
  };

  await renderDir(destPath);
}
