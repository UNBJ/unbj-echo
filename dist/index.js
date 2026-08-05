"use strict";var D=Object.create;var P=Object.defineProperty;var q=Object.getOwnPropertyDescriptor;var M=Object.getOwnPropertyNames;var I=Object.getPrototypeOf,F=Object.prototype.hasOwnProperty;var $=(e,o,n,s)=>{if(o&&typeof o=="object"||typeof o=="function")for(let r of M(o))!F.call(e,r)&&r!==n&&P(e,r,{get:()=>o[r],enumerable:!(s=q(o,r))||s.enumerable});return e};var f=(e,o,n)=>(n=e!=null?D(I(e)):{},$(o||!e||!e.__esModule?P(n,"default",{value:e,enumerable:!0}):n,e));var A=f(require("path")),S=require("commander"),l=require("@clack/prompts"),c=f(require("picocolors"));var t=f(require("fs-extra")),a=f(require("path")),E=f(require("ejs"));function V(e){return e.split(/\s+/).filter(Boolean).slice(0,3).map(o=>o[0].toUpperCase()).join("")}async function k(e,o){let n=a.default.join(__dirname,"..","templates");t.default.existsSync(n)||(n=a.default.join(__dirname,"..","..","templates"));let s=a.default.join(n,"base"),r=a.default.join(n,"archetypes",o.archetype);await t.default.ensureDir(e),await t.default.pathExists(s)?await t.default.copy(s,e):await G(e),await t.default.pathExists(r)&&await t.default.copy(r,e,{overwrite:!0});let d=["tshirt","workshops","rooms","voting"],u=[];for(let i of d){let p=a.default.join(n,"modules",i);if(await t.default.pathExists(p)){let m=await z(p,e,o);m&&u.push(m)}}await Y(e,o),await J(e,{...o,moduleEndpointsYaml:u.join(`
`)})}async function G(e){let o=["apps/portal/src/app","apps/admin/src/app","packages/api/src/handlers","packages/shared/src/types"];for(let n of o)await t.default.ensureDir(a.default.join(e,n));await t.default.writeFile(a.default.join(e,"pnpm-workspace.yaml"),`packages:
  - 'apps/*'
  - 'packages/*'
`)}async function z(e,o,n){return await t.default.copy(e,o,{overwrite:!0,filter:s=>!s.endsWith("inject-config.json")}),H(e,o,n)}async function H(e,o,n){let s=a.default.join(e,"inject-config.json");if(await t.default.pathExists(s)){let r=await t.default.readJson(s),d="";return r.serverless&&(d=O(r.serverless)),r.dependencies&&await W(o,r.dependencies),d}return""}function O(e){let o=`  # --- Endpoints Inyectados por M\xF3dulo ---
`;for(let[n,s]of Object.entries(e.functions||{})){let r=s;if(o+=`  ${n}:
`,o+=`    handler: ${r.handler}
`,r.events&&r.events.length>0){o+=`    events:
`;for(let d of r.events)d.httpApi&&(o+=`      - httpApi:
`,o+=`          path: ${d.httpApi.path}
`,o+=`          method: ${d.httpApi.method.toUpperCase()}
`)}}return o}async function W(e,o){for(let n of Object.keys(o)){let s=a.default.join(e,n,"package.json");if(await t.default.pathExists(s)){let r=await t.default.readJson(s);r.dependencies={...r.dependencies,...o[n]},await t.default.writeJson(s,r,{spaces:2})}}}async function Y(e,o){let n=a.default.join(e,"apps","portal"),s=a.default.join(n,"messages");await t.default.ensureDir(s);let r={common:{title:o.eventName,loading:"Cargando..."},register:{title:"Formulario de Registro",submit:"Registrarse"},tshirt:{title:"Playera del Evento",subtitle:"Elige tu talla oficial para el kit de bienvenida",chosen:"Talla de playera elegida",confirmed:"Confirmado",selectionText:"Has seleccionado la talla {size}. Te entregaremos tu playera oficial el d\xEDa del registro presencial.",notAvailable:"La selecci\xF3n de talla de playera estar\xE1 disponible una vez que tu pago de inscripci\xF3n haya sido aprobado.",confirmBtn:"Confirmar Talla",loading:"Cargando m\xF3dulo de playera...",errorSelect:"Ocurri\xF3 un error al guardar tu talla.",errorLoad:"Error al cargar estado de playera"},workshops:{title:"Selecci\xF3n de Talleres",subtitle:"Elige un taller para cada uno de los d\xEDas del evento. Puedes cambiar tu selecci\xF3n antes del evento.",loading:"Cargando talleres...",noWorkshops:"No hay talleres disponibles programados para este d\xEDa.",yourSelection:"Tu Selecci\xF3n:",none:"Ninguno",martes:"Martes",miercoles:"Mi\xE9rcoles",jueves:"Jueves",saveBtn:"Guardar Selecci\xF3n",savedTitle:"Selecci\xF3n Guardada",savedSuccess:"Tu selecci\xF3n de talleres ha sido registrada con \xE9xito.",backBtn:"Volver al portal",enroll:"Inscribirse en este taller",selected:"Taller seleccionado",full:"Cupo completo",spacesAvailable:"{count} lugares disponibles",presentedBy:"impartido por",errorLoad:"Error al cargar talleres",errorSubmit:"Error al guardar selecci\xF3n"},voting:{loading:"Iniciando panel de votaci\xF3n...",backBtn:"Volver al Portal",liveTitle:"Votaciones en Vivo",panelTitle:"Panel de Votaci\xF3n",noActive:"Actualmente no hay ninguna propuesta o votaci\xF3n activa. En cuanto el moderador inicie una votaci\xF3n, esta pantalla se actualizar\xE1 autom\xE1ticamente.",voteReceived:"\xA1Voto Recibido!",voteSuccessText:'Tu voto para la propuesta "{title}" ha sido registrado correctamente.',waitingResults:"Esperando resultados en pantalla...",closedResultsTitle:"Resultados cerrados",closedResultsEmpty:"A\xFAn no hay votaciones cerradas para consultar.",closedAt:"Cerrada el {date}",totalVotes:"{count} votos totales",voteCount:"{count} voto",voteCountPlural:"{count} votos",winner:"Opci\xF3n ganadora",tie:"Empate",activeProposal:"Propuesta Activa",submitBtn:"Emitir Voto",errorLoad:"Error al conectar con la base de datos de votaci\xF3n.",errorSubmit:"Error al registrar tu voto"},rooms:{loading:"Cargando m\xF3dulo de hospedaje...",title:"Hospedaje y Habitaciones",subtitle:"Gestiona tu asignaci\xF3n de habitaci\xF3n, crea un grupo nuevo o \xFAnete a una habitaci\xF3n existente utilizando un c\xF3digo de invitaci\xF3n.",backBtn:"Volver al portal",notAvailable:"La gesti\xF3n de hospedaje estar\xE1 disponible una vez que tu pago haya sido aprobado por los administradores.",requestSentTitle:"Solicitud de Uni\xF3n Enviada",requestSentText:"Has solicitado unirte a la habitaci\xF3n creada por {name}.",requestPendingText:"Tu solicitud est\xE1 pendiente de aprobaci\xF3n por parte del responsable.",cancelRequestBtn:"Cancelar Solicitud",myRoomTitle:"Mi Habitaci\xF3n",inviteCode:"C\xF3digo de Invitaci\xF3n:",roomType:"Tipo:",genderFilter:"G\xE9nero:",capacity:"Capacidad:",members:"Integrantes",roleResponsible:"Responsable",roleGuest:"Invitado",pendingRequests:"Solicitudes de Uni\xF3n Pendientes",acceptBtn:"Aceptar",rejectBtn:"Rechazar",leaveBtn:"Salir de la habitaci\xF3n",createRoomTitle:"Crear Habitaci\xF3n Nueva",roomNameLabel:"Nombre del grupo / Habitaci\xF3n:",roomNamePlaceholder:'Nombre descriptivo (ej. "Familia G\xF3mez" o "J\xF3venes Iglesia")',roomTypeLabel:"Tipo de Habitaci\xF3n:",genderFilterLabel:"Filtro de G\xE9nero:",genderMen:"Solo Hombres",genderWomen:"Solo Mujeres",genderMixed:"Mixto",createBtn:"Crear Habitaci\xF3n",joinRoomTitle:"Unirse a una Habitaci\xF3n",joinRoomText:"Introduce el c\xF3digo de invitaci\xF3n que te proporcion\xF3 el responsable del grupo.",joinCodeLabel:"C\xF3digo de invitaci\xF3n:",joinBtn:"Enviar Solicitud de Uni\xF3n",errorLoad:"Error al cargar estado de hospedaje",errorConnection:"Error de conexi\xF3n. Intenta de nuevo."}},d={common:{title:o.eventName,loading:"Loading..."},register:{title:"Registration Form",submit:"Register"},tshirt:{title:"Event T-Shirt",subtitle:"Choose your official size for the welcome kit",chosen:"T-shirt size chosen",confirmed:"Confirmed",selectionText:"You have selected size {size}. We will deliver your official t-shirt on the day of in-person registration.",notAvailable:"T-shirt size selection will be available once your registration payment has been approved.",confirmBtn:"Confirm Size",loading:"Loading t-shirt module...",errorSelect:"An error occurred while saving your size.",errorLoad:"Error loading t-shirt status"},workshops:{title:"Workshops Selection",subtitle:"Choose a workshop for each day of the event. You can change your selection before the event.",loading:"Loading workshops...",noWorkshops:"No workshops available scheduled for this day.",yourSelection:"Your Selection:",none:"None",martes:"Tuesday",miercoles:"Wednesday",jueves:"Thursday",saveBtn:"Save Selection",savedTitle:"Selection Saved",savedSuccess:"Your workshop selection has been registered successfully.",backBtn:"Back to portal",enroll:"Enroll in this workshop",selected:"Selected workshop",full:"Fully booked",spacesAvailable:"{count} spaces available",presentedBy:"presented by",errorLoad:"Error loading workshops",errorSubmit:"Error saving selection"},voting:{loading:"Starting voting panel...",backBtn:"Back to Portal",liveTitle:"Live Voting",panelTitle:"Voting Panel",noActive:"Currently there is no active proposal or vote. As soon as the moderator starts a vote, this screen will update automatically.",voteReceived:"Vote Received!",voteSuccessText:'Your vote for proposal "{title}" has been registered successfully.',waitingResults:"Waiting for results on screen...",closedResultsTitle:"Closed results",closedResultsEmpty:"There are no closed votes to review yet.",closedAt:"Closed on {date}",totalVotes:"{count} total votes",voteCount:"{count} vote",voteCountPlural:"{count} votes",winner:"Winning option",tie:"Tie",activeProposal:"Active Proposal",submitBtn:"Submit Vote",errorLoad:"Error connecting to voting database.",errorSubmit:"Error registering your vote"},rooms:{loading:"Loading lodging module...",title:"Lodging & Rooms",subtitle:"Manage your room assignment, create a new group, or join an existing room using an invitation code.",backBtn:"Back to portal",notAvailable:"Lodging management will be available once your payment has been approved by the administrators.",requestSentTitle:"Join Request Sent",requestSentText:"You have requested to join the room created by {name}.",requestPendingText:"Your request is pending approval by the responsible person.",cancelRequestBtn:"Cancel Request",myRoomTitle:"My Room",inviteCode:"Invitation Code:",roomType:"Type:",genderFilter:"Gender:",capacity:"Capacity:",members:"Members",roleResponsible:"Responsible",roleGuest:"Guest",pendingRequests:"Pending Join Requests",acceptBtn:"Accept",rejectBtn:"Reject",leaveBtn:"Leave room",createRoomTitle:"Create New Room",roomNameLabel:"Group / Room Name:",roomNamePlaceholder:'Descriptive name (e.g. "Gomez Family" or "Church Youth")',roomTypeLabel:"Room Type:",genderFilterLabel:"Gender Filter:",genderMen:"Men Only",genderWomen:"Women Only",genderMixed:"Mixed",createBtn:"Create Room",joinRoomTitle:"Join a Room",joinRoomText:"Enter the invitation code provided by the group manager.",joinCodeLabel:"Invitation code:",joinBtn:"Send Join Request",errorLoad:"Error loading lodging status",errorConnection:"Connection error. Try again."}},u=a.default.join(s,"es.json");if(await t.default.writeJson(u,r,{spaces:2}),o.languages==="es-en"){let i=a.default.join(s,"en.json");await t.default.writeJson(i,d,{spaces:2});let p=a.default.join(n,"package.json");if(await t.default.pathExists(p)){let g=await t.default.readJson(p);g.dependencies={...g.dependencies,"next-intl":"^3.25.1"},await t.default.writeJson(p,g,{spaces:2})}let m=a.default.join(n,"src","app"),h=a.default.join(m,"[locale]");await t.default.ensureDir(h);let B=["portal","registro","layout.tsx.ejs","page.tsx"];for(let g of B){let T=a.default.join(m,g),N=a.default.join(h,g);await t.default.pathExists(T)&&await t.default.move(T,N,{overwrite:!0})}await t.default.writeFile(a.default.join(m,"layout.tsx"),`import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { branding, hexToRgbTriplet } from '@unbj/shared'
import './globals.css'

const interBody = Inter({ subsets: ['latin'], variable: '--font-body' })
const interHeading = Inter({ subsets: ['latin'], variable: '--font-heading' })

const accentStyle = \`:root{--accent:\${hexToRgbTriplet(branding.accentColor)};--accent-hover:\${hexToRgbTriplet(branding.accentHoverColor)}}\`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={\`\${interBody.variable} \${interHeading.variable}\`}>
        <style dangerouslySetInnerHTML={{ __html: accentStyle }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
`,"utf8");let b=a.default.join(m,"registro"),w=a.default.join(b,"completado"),v=a.default.join(m,"portal","[token]"),j=a.default.join(v,"habitaciones"),x=a.default.join(v,"talleres"),C=a.default.join(v,"votacion");await t.default.ensureDir(w),await t.default.ensureDir(v),await t.default.ensureDir(j),await t.default.ensureDir(x),await t.default.ensureDir(C),await t.default.writeFile(a.default.join(m,"page.tsx"),`import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/es/registro')
}
`,"utf8"),await t.default.writeFile(a.default.join(b,"page.tsx"),`import { redirect } from 'next/navigation'

export default function RegistroAliasPage() {
  redirect('/es/registro')
}
`,"utf8"),await t.default.writeFile(a.default.join(w,"page.tsx"),`import { redirect } from 'next/navigation'

export default function RegistroCompletadoAliasPage() {
  redirect('/es/registro/completado')
}
`,"utf8"),await t.default.writeFile(a.default.join(v,"page.tsx"),`import { redirect } from 'next/navigation'

export default async function PortalAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}\`)
}
`,"utf8"),await t.default.writeFile(a.default.join(j,"page.tsx"),`import { redirect } from 'next/navigation'

export default async function PortalHabitacionesAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}/habitaciones\`)
}
`,"utf8"),await t.default.writeFile(a.default.join(x,"page.tsx"),`import { redirect } from 'next/navigation'

export default async function PortalTalleresAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}/talleres\`)
}
`,"utf8"),await t.default.writeFile(a.default.join(C,"page.tsx"),`import { redirect } from 'next/navigation'

export default async function PortalVotacionAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}/votacion\`)
}
`,"utf8");let R=a.default.join(n,"src"),y=a.default.join(R,"i18n");await t.default.ensureDir(y),await t.default.writeFile(a.default.join(y,"routing.ts"),`import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es'
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
`,"utf8"),await t.default.writeFile(a.default.join(y,"request.ts"),`import { getRequestConfig } from 'next-intl/server'
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
`,"utf8"),await t.default.writeFile(a.default.join(R,"middleware.ts"),`import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
`,"utf8")}}async function J(e,o){let n=async s=>{let r=await t.default.readdir(s);for(let d of r){let u=a.default.join(s,d);if((await t.default.stat(u)).isDirectory())await n(u);else if(d.endsWith(".ejs")){let p=await t.default.readFile(u,"utf8"),m=E.default.render(p,{projectName:o.projectName,eventName:o.eventName,initials:V(o.eventName),archetype:o.archetype,languages:o.languages,modules:o.modules,moduleEndpointsYaml:o.moduleEndpointsYaml}),h=u.substring(0,u.length-4);await t.default.writeFile(h,m,"utf8"),await t.default.remove(u)}}};await n(e)}var L=new S.Command;L.name("unbj-echo").description("CLI to generate customized event registration platforms").version("1.0.0").option("-n, --name <name>","Nombre de la carpeta del proyecto").option("-e, --event <event>","Nombre del evento").option("-a, --archetype <archetype>","Arquetipo base (standard, roles, plenarias)").option("-m, --modules <modules>","M\xF3dulos separados por coma (tshirt, workshops, rooms, voting)").option("-l, --languages <languages>","Idiomas (es, es-en)").option("-y, --yes","Omitir confirmaci\xF3n de generaci\xF3n").action(async e=>{console.clear(),(0,l.intro)(c.default.cyan("\u{1F47E} unbj-echo \u2014 CLI de Echo")),e.archetype&&!["standard","roles","plenarias"].includes(e.archetype)&&(console.error(c.default.red(`Error: Arquetipo inv\xE1lido "${e.archetype}". Debe ser "standard", "roles" o "plenarias".`)),process.exit(1)),e.languages&&!["es","es-en"].includes(e.languages)&&(console.error(c.default.red(`Error: Idioma inv\xE1lido "${e.languages}". Debe ser "es" o "es-en".`)),process.exit(1));let o;if(e.name)o=e.name;else{let i=await(0,l.text)({message:"\xBFC\xF3mo se llamar\xE1 la carpeta del proyecto?",placeholder:"mi-plataforma-registro",defaultValue:"mi-plataforma-registro",validate(p){if(p.trim().length===0)return"El nombre no puede estar vac\xEDo";if(/[^a-zA-Z0-9-_]/.test(p))return"El nombre solo puede contener letras, n\xFAmeros, guiones y guiones bajos"}});typeof i=="symbol"&&((0,l.outro)(c.default.yellow("Proceso cancelado.")),process.exit(0)),o=i}let n;if(e.event)n=e.event;else{let i=await(0,l.text)({message:"\xBFCu\xE1l es el nombre del evento?",placeholder:"Congreso Anual 2026",defaultValue:"Congreso Anual 2026",validate(p){if(p.trim().length===0)return"El nombre del evento no puede estar vac\xEDo"}});typeof i=="symbol"&&((0,l.outro)(c.default.yellow("Proceso cancelado.")),process.exit(0)),n=i}let s;if(e.archetype)s=e.archetype;else{let i=await(0,l.select)({message:"Selecciona el arquetipo de flujo base para el evento:",options:[{value:"standard",label:"Registro Est\xE1ndar",hint:"Formulario b\xE1sico + Pago + QR (Ideal para congresos y festivales)"},{value:"roles",label:"Registro por Roles / Entradas",hint:"Categor\xEDas (VIP, General, Estudiante) con precios y cupos independientes"},{value:"plenarias",label:"Registro por Iglesias / Delegados",hint:"B\xFAsqueda de iglesia, validaci\xF3n de cupos de mensajeros y carga de carta"}]});typeof i=="symbol"&&((0,l.outro)(c.default.yellow("Proceso cancelado.")),process.exit(0)),s=i}let r;if(e.modules!==void 0){r=e.modules?e.modules.split(",").map(p=>p.trim()):[];let i=["tshirt","workshops","rooms","voting"];for(let p of r)i.includes(p)||(console.error(c.default.red(`Error: M\xF3dulo inv\xE1lido "${p}". Debe ser uno de: ${i.join(", ")}`)),process.exit(1))}else{let i=await(0,l.multiselect)({message:"Selecciona los m\xF3dulos adicionales a inyectar (Rompecabezas):",options:[{value:"tshirt",label:"Tallas de Playeras",hint:"A\xF1ade campo de talla en el formulario y estad\xEDsticas de pedido en el panel de administraci\xF3n"},{value:"workshops",label:"Selecci\xF3n de Talleres",hint:"A\xF1ade cat\xE1logo de talleres con cupo limitado y selecci\xF3n post-pago"},{value:"rooms",label:"Hospedaje y Asignaci\xF3n de Cuartos",hint:"L\xF3gica completa de responsable de habitaci\xF3n, c\xF3digos de invitaci\xF3n y compa\xF1eros"},{value:"voting",label:"Votaci\xF3n en Tiempo Real",hint:"Votaciones an\xF3nimas en vivo (para el portal) y visor en proyector (para el panel admin)"}],required:!1});typeof i=="symbol"&&((0,l.outro)(c.default.yellow("Proceso cancelado.")),process.exit(0)),r=i}let d;if(e.languages)d=e.languages;else{let i=await(0,l.select)({message:"\xBFEl portal de registro debe contar con soporte multi-idioma (next-intl)?",options:[{value:"es-en",label:"S\xED, Multi-idioma (Espa\xF1ol e Ingl\xE9s)",hint:"Configura locales es/en y selector de idioma en el portal"},{value:"es",label:"No, Solo Espa\xF1ol",hint:"El portal estar\xE1 predeterminado \xFAnicamente en espa\xF1ol"}]});typeof i=="symbol"&&((0,l.outro)(c.default.yellow("Proceso cancelado.")),process.exit(0)),d=i}if(!e.yes){console.log(`
`+c.default.cyan("\u{1F4CB} Resumen de la Configuraci\xF3n:")),console.log(`  \u2022 Carpeta:      ${c.default.green(o)}`),console.log(`  \u2022 Evento:       ${c.default.green(n)}`),console.log(`  \u2022 Arquetipo:    ${c.default.green(s)}`),console.log(`  \u2022 M\xF3dulos:      ${c.default.green(r.length>0?r.join(", "):"Ninguno")}`),console.log(`  \u2022 Idiomas:      ${c.default.green(d)}
`);let i=await(0,l.confirm)({message:"\xBFQuieres generar la plataforma de registro con esta configuraci\xF3n?"});(!i||typeof i=="symbol")&&((0,l.outro)(c.default.yellow("Generaci\xF3n cancelada por el usuario.")),process.exit(0))}let u=(0,l.spinner)();u.start("Generando estructura de archivos y configuraciones...");try{let i=A.default.resolve(process.cwd(),o);await k(i,{projectName:o,eventName:n,archetype:s,modules:r,languages:d}),u.stop("\xA1Estructura base generada!")}catch(i){u.stop("Error durante la generaci\xF3n"),(0,l.outro)(c.default.red(`Ocurri\xF3 un error: ${i.message}`)),process.exit(1)}(0,l.outro)(c.default.green(`\u{1F389} Plataforma creada con \xE9xito en el directorio ./${o}
`)+c.default.dim(`Siguientes pasos:
`)+c.default.dim(`  1. cd ${o}
`)+c.default.dim("  2. Sigue las instrucciones de configuraci\xF3n en el README.md"))});L.parse(process.argv);
