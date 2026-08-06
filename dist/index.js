#!/usr/bin/env node
"use strict";var I=Object.create;var P=Object.defineProperty;var V=Object.getOwnPropertyDescriptor;var z=Object.getOwnPropertyNames;var O=Object.getPrototypeOf,H=Object.prototype.hasOwnProperty;var Y=(e,t,n,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of z(t))!H.call(e,r)&&r!==n&&P(e,r,{get:()=>t[r],enumerable:!(s=V(t,r))||s.enumerable});return e};var f=(e,t,n)=>(n=e!=null?I(O(e)):{},Y(t||!e||!e.__esModule?P(n,"default",{value:e,enumerable:!0}):n,e));var w=f(require("fs-extra")),j=f(require("path")),q=require("commander"),d=require("@clack/prompts"),l=f(require("picocolors"));var o=f(require("fs-extra")),a=f(require("path")),A=require("child_process"),L=f(require("ejs"));function W(e){return e.split(/\s+/).filter(Boolean).slice(0,3).map(t=>t[0].toUpperCase()).join("")}async function N(e,t){let n=a.default.join(__dirname,"..","templates");o.default.existsSync(n)||(n=a.default.join(__dirname,"..","..","templates"));let s=a.default.join(n,"base"),r=a.default.join(n,"archetypes",t.archetype);await o.default.ensureDir(e),await o.default.pathExists(s)?await o.default.copy(s,e):await J(e),await o.default.pathExists(r)&&await o.default.copy(r,e,{overwrite:!0});let c=["tshirt","workshops","rooms","voting"],p=[];for(let u of c){let i=a.default.join(n,"modules",u);if(await o.default.pathExists(i)){let m=await U(i,e,t);m&&p.push(m)}}await X(e,t),await Z(e,{...t,moduleEndpointsYaml:p.join(`
`)});let g=a.default.join(e,"scripts","context-refresh.mjs");await o.default.pathExists(g)&&(0,A.execFileSync)(process.execPath,[g],{cwd:e,stdio:"ignore"})}async function J(e){let t=["apps/portal/src/app","apps/admin/src/app","packages/api/src/handlers","packages/shared/src/types"];for(let n of t)await o.default.ensureDir(a.default.join(e,n));await o.default.writeFile(a.default.join(e,"pnpm-workspace.yaml"),`packages:
  - 'apps/*'
  - 'packages/*'
`)}async function U(e,t,n){return await o.default.copy(e,t,{overwrite:!0,filter:s=>!s.endsWith("inject-config.json")}),_(e,t,n)}async function _(e,t,n){let s=a.default.join(e,"inject-config.json");if(await o.default.pathExists(s)){let r=await o.default.readJson(s),c="";return r.serverless&&(c=Q(r.serverless)),r.dependencies&&await K(t,r.dependencies),c}return""}function Q(e){let t=`  # --- Endpoints Inyectados por M\xF3dulo ---
`;for(let[n,s]of Object.entries(e.functions||{})){let r=s;if(t+=`  ${n}:
`,t+=`    handler: ${r.handler}
`,r.events&&r.events.length>0){t+=`    events:
`;for(let c of r.events)c.httpApi&&(t+=`      - httpApi:
`,t+=`          path: ${c.httpApi.path}
`,t+=`          method: ${c.httpApi.method.toUpperCase()}
`)}}return t}async function K(e,t){for(let n of Object.keys(t)){let s=a.default.join(e,n,"package.json");if(await o.default.pathExists(s)){let r=await o.default.readJson(s);r.dependencies={...r.dependencies,...t[n]},await o.default.writeJson(s,r,{spaces:2})}}}async function X(e,t){let n=a.default.join(e,"apps","portal"),s=a.default.join(n,"messages");await o.default.ensureDir(s);let r={common:{title:t.eventName,loading:"Cargando..."},register:{title:"Formulario de Registro",submit:"Registrarse"},tshirt:{title:"Playera del Evento",subtitle:"Elige tu talla oficial para el kit de bienvenida",chosen:"Talla de playera elegida",confirmed:"Confirmado",selectionText:"Has seleccionado la talla {size}. Te entregaremos tu playera oficial el d\xEDa del registro presencial.",notAvailable:"La selecci\xF3n de talla de playera estar\xE1 disponible una vez que tu pago de inscripci\xF3n haya sido aprobado.",confirmBtn:"Confirmar Talla",loading:"Cargando m\xF3dulo de playera...",errorSelect:"Ocurri\xF3 un error al guardar tu talla.",errorLoad:"Error al cargar estado de playera"},workshops:{title:"Selecci\xF3n de Talleres",subtitle:"Elige un taller para cada uno de los d\xEDas del evento. Puedes cambiar tu selecci\xF3n antes del evento.",loading:"Cargando talleres...",noWorkshops:"No hay talleres disponibles programados para este d\xEDa.",yourSelection:"Tu Selecci\xF3n:",none:"Ninguno",martes:"Martes",miercoles:"Mi\xE9rcoles",jueves:"Jueves",saveBtn:"Guardar Selecci\xF3n",savedTitle:"Selecci\xF3n Guardada",savedSuccess:"Tu selecci\xF3n de talleres ha sido registrada con \xE9xito.",backBtn:"Volver al portal",enroll:"Inscribirse en este taller",selected:"Taller seleccionado",full:"Cupo completo",spacesAvailable:"{count} lugares disponibles",presentedBy:"impartido por",errorLoad:"Error al cargar talleres",errorSubmit:"Error al guardar selecci\xF3n"},voting:{loading:"Iniciando panel de votaci\xF3n...",backBtn:"Volver al Portal",liveTitle:"Votaciones en Vivo",panelTitle:"Panel de Votaci\xF3n",noActive:"Actualmente no hay ninguna propuesta o votaci\xF3n activa. En cuanto el moderador inicie una votaci\xF3n, esta pantalla se actualizar\xE1 autom\xE1ticamente.",voteReceived:"\xA1Voto Recibido!",voteSuccessText:'Tu voto para la propuesta "{title}" ha sido registrado correctamente.',waitingResults:"Esperando resultados en pantalla...",closedResultsTitle:"Resultados cerrados",closedResultsEmpty:"A\xFAn no hay votaciones cerradas para consultar.",closedAt:"Cerrada el {date}",totalVotes:"{count} votos totales",voteCount:"{count} voto",voteCountPlural:"{count} votos",winner:"Opci\xF3n ganadora",tie:"Empate",activeProposal:"Propuesta Activa",submitBtn:"Emitir Voto",errorLoad:"Error al conectar con la base de datos de votaci\xF3n.",errorSubmit:"Error al registrar tu voto"},rooms:{loading:"Cargando m\xF3dulo de hospedaje...",title:"Hospedaje y Habitaciones",subtitle:"Gestiona tu asignaci\xF3n de habitaci\xF3n, crea un grupo nuevo o \xFAnete a una habitaci\xF3n existente utilizando un c\xF3digo de invitaci\xF3n.",backBtn:"Volver al portal",notAvailable:"La gesti\xF3n de hospedaje estar\xE1 disponible una vez que tu pago haya sido aprobado por los administradores.",requestSentTitle:"Solicitud de Uni\xF3n Enviada",requestSentText:"Has solicitado unirte a la habitaci\xF3n creada por {name}.",requestPendingText:"Tu solicitud est\xE1 pendiente de aprobaci\xF3n por parte del responsable.",cancelRequestBtn:"Cancelar Solicitud",myRoomTitle:"Mi Habitaci\xF3n",inviteCode:"C\xF3digo de Invitaci\xF3n:",roomType:"Tipo:",genderFilter:"G\xE9nero:",capacity:"Capacidad:",members:"Integrantes",roleResponsible:"Responsable",roleGuest:"Invitado",pendingRequests:"Solicitudes de Uni\xF3n Pendientes",acceptBtn:"Aceptar",rejectBtn:"Rechazar",leaveBtn:"Salir de la habitaci\xF3n",createRoomTitle:"Crear Habitaci\xF3n Nueva",roomNameLabel:"Nombre del grupo / Habitaci\xF3n:",roomNamePlaceholder:'Nombre descriptivo (ej. "Familia G\xF3mez" o "J\xF3venes Iglesia")',roomTypeLabel:"Tipo de Habitaci\xF3n:",genderFilterLabel:"Filtro de G\xE9nero:",genderMen:"Solo Hombres",genderWomen:"Solo Mujeres",genderMixed:"Mixto",createBtn:"Crear Habitaci\xF3n",joinRoomTitle:"Unirse a una Habitaci\xF3n",joinRoomText:"Introduce el c\xF3digo de invitaci\xF3n que te proporcion\xF3 el responsable del grupo.",joinCodeLabel:"C\xF3digo de invitaci\xF3n:",joinBtn:"Enviar Solicitud de Uni\xF3n",errorLoad:"Error al cargar estado de hospedaje",errorConnection:"Error de conexi\xF3n. Intenta de nuevo."}},c={common:{title:t.eventName,loading:"Loading..."},register:{title:"Registration Form",submit:"Register"},tshirt:{title:"Event T-Shirt",subtitle:"Choose your official size for the welcome kit",chosen:"T-shirt size chosen",confirmed:"Confirmed",selectionText:"You have selected size {size}. We will deliver your official t-shirt on the day of in-person registration.",notAvailable:"T-shirt size selection will be available once your registration payment has been approved.",confirmBtn:"Confirm Size",loading:"Loading t-shirt module...",errorSelect:"An error occurred while saving your size.",errorLoad:"Error loading t-shirt status"},workshops:{title:"Workshops Selection",subtitle:"Choose a workshop for each day of the event. You can change your selection before the event.",loading:"Loading workshops...",noWorkshops:"No workshops available scheduled for this day.",yourSelection:"Your Selection:",none:"None",martes:"Tuesday",miercoles:"Wednesday",jueves:"Thursday",saveBtn:"Save Selection",savedTitle:"Selection Saved",savedSuccess:"Your workshop selection has been registered successfully.",backBtn:"Back to portal",enroll:"Enroll in this workshop",selected:"Selected workshop",full:"Fully booked",spacesAvailable:"{count} spaces available",presentedBy:"presented by",errorLoad:"Error loading workshops",errorSubmit:"Error saving selection"},voting:{loading:"Starting voting panel...",backBtn:"Back to Portal",liveTitle:"Live Voting",panelTitle:"Voting Panel",noActive:"Currently there is no active proposal or vote. As soon as the moderator starts a vote, this screen will update automatically.",voteReceived:"Vote Received!",voteSuccessText:'Your vote for proposal "{title}" has been registered successfully.',waitingResults:"Waiting for results on screen...",closedResultsTitle:"Closed results",closedResultsEmpty:"There are no closed votes to review yet.",closedAt:"Closed on {date}",totalVotes:"{count} total votes",voteCount:"{count} vote",voteCountPlural:"{count} votes",winner:"Winning option",tie:"Tie",activeProposal:"Active Proposal",submitBtn:"Submit Vote",errorLoad:"Error connecting to voting database.",errorSubmit:"Error registering your vote"},rooms:{loading:"Loading lodging module...",title:"Lodging & Rooms",subtitle:"Manage your room assignment, create a new group, or join an existing room using an invitation code.",backBtn:"Back to portal",notAvailable:"Lodging management will be available once your payment has been approved by the administrators.",requestSentTitle:"Join Request Sent",requestSentText:"You have requested to join the room created by {name}.",requestPendingText:"Your request is pending approval by the responsible person.",cancelRequestBtn:"Cancel Request",myRoomTitle:"My Room",inviteCode:"Invitation Code:",roomType:"Type:",genderFilter:"Gender:",capacity:"Capacity:",members:"Members",roleResponsible:"Responsible",roleGuest:"Guest",pendingRequests:"Pending Join Requests",acceptBtn:"Accept",rejectBtn:"Reject",leaveBtn:"Leave room",createRoomTitle:"Create New Room",roomNameLabel:"Group / Room Name:",roomNamePlaceholder:'Descriptive name (e.g. "Gomez Family" or "Church Youth")',roomTypeLabel:"Room Type:",genderFilterLabel:"Gender Filter:",genderMen:"Men Only",genderWomen:"Women Only",genderMixed:"Mixed",createBtn:"Create Room",joinRoomTitle:"Join a Room",joinRoomText:"Enter the invitation code provided by the group manager.",joinCodeLabel:"Invitation code:",joinBtn:"Send Join Request",errorLoad:"Error loading lodging status",errorConnection:"Connection error. Try again."}},p=a.default.join(s,"es.json");if(await o.default.writeJson(p,r,{spaces:2}),t.languages==="es-en"){let g=a.default.join(s,"en.json");await o.default.writeJson(g,c,{spaces:2});let u=a.default.join(n,"package.json");if(await o.default.pathExists(u)){let v=await o.default.readJson(u);v.dependencies={...v.dependencies,"next-intl":"^3.25.1"},await o.default.writeJson(u,v,{spaces:2})}let i=a.default.join(n,"src","app"),m=a.default.join(i,"[locale]");await o.default.ensureDir(m);let F=["portal","registro","layout.tsx.ejs","page.tsx"];for(let v of F){let k=a.default.join(i,v),G=a.default.join(m,v);await o.default.pathExists(k)&&await o.default.move(k,G,{overwrite:!0})}await o.default.writeFile(a.default.join(i,"layout.tsx"),`import { GeistSans } from 'geist/font/sans'
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
`,"utf8");let x=a.default.join(i,"registro"),C=a.default.join(x,"completado"),h=a.default.join(i,"portal","[token]"),R=a.default.join(h,"habitaciones"),T=a.default.join(h,"talleres"),E=a.default.join(h,"votacion");await o.default.ensureDir(C),await o.default.ensureDir(h),await o.default.ensureDir(R),await o.default.ensureDir(T),await o.default.ensureDir(E),await o.default.writeFile(a.default.join(i,"page.tsx"),`import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/es/registro')
}
`,"utf8"),await o.default.writeFile(a.default.join(x,"page.tsx"),`import { redirect } from 'next/navigation'

export default function RegistroAliasPage() {
  redirect('/es/registro')
}
`,"utf8"),await o.default.writeFile(a.default.join(C,"page.tsx"),`import { redirect } from 'next/navigation'

export default function RegistroCompletadoAliasPage() {
  redirect('/es/registro/completado')
}
`,"utf8"),await o.default.writeFile(a.default.join(h,"page.tsx"),`import { redirect } from 'next/navigation'

export default async function PortalAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}\`)
}
`,"utf8"),await o.default.writeFile(a.default.join(R,"page.tsx"),`import { redirect } from 'next/navigation'

export default async function PortalHabitacionesAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}/habitaciones\`)
}
`,"utf8"),await o.default.writeFile(a.default.join(T,"page.tsx"),`import { redirect } from 'next/navigation'

export default async function PortalTalleresAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}/talleres\`)
}
`,"utf8"),await o.default.writeFile(a.default.join(E,"page.tsx"),`import { redirect } from 'next/navigation'

export default async function PortalVotacionAliasPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(\`/es/portal/\${token}/votacion\`)
}
`,"utf8");let S=a.default.join(n,"src"),b=a.default.join(S,"i18n");await o.default.ensureDir(b),await o.default.writeFile(a.default.join(b,"routing.ts"),`import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es'
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
`,"utf8"),await o.default.writeFile(a.default.join(b,"request.ts"),`import { getRequestConfig } from 'next-intl/server'
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
`,"utf8"),await o.default.writeFile(a.default.join(S,"middleware.ts"),`import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
`,"utf8")}}async function Z(e,t){let n=async s=>{let r=await o.default.readdir(s);for(let c of r){let p=a.default.join(s,c);if((await o.default.stat(p)).isDirectory())await n(p);else if(c.endsWith(".ejs")){let u=await o.default.readFile(p,"utf8"),i=L.default.render(u,{projectName:t.projectName,eventName:t.eventName,initials:W(t.eventName),archetype:t.archetype,languages:t.languages,modules:t.modules,moduleEndpointsYaml:t.moduleEndpointsYaml}),m=p.substring(0,p.length-4);await o.default.writeFile(m,i,"utf8"),await o.default.remove(p)}}};await n(e)}var D=["standard","roles","plenarias"],B=["es","es-en"],M=["tshirt","workshops","rooms","voting"];function ee(e){return e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"evento"}function y(){(0,d.outro)(l.default.yellow("Proceso cancelado.")),process.exit(0)}async function te(){let e=await(0,d.text)({message:"\xBFCu\xE1l es el nombre del evento?",placeholder:"Congreso Anual 2026",validate(t){if(!t.trim())return"El nombre del evento no puede estar vac\xEDo"}});return typeof e=="symbol"&&y(),e}function oe(e){if(!w.default.existsSync(e))return;if(w.default.readdirSync(e).length>0)throw new Error(`La carpeta destino ya existe y no est\xE1 vac\xEDa: ${e}. Usa --output con otra ruta.`)}var $=new q.Command;$.name("unbj-echo").description("CLI to generate customized event registration platforms").version("1.0.0").option("-n, --event-name <name>","Nombre visible del evento").option("-e, --event <event>","Alias compatible de --event-name").option("-o, --output <path>","Ruta de salida (por defecto, una subcarpeta del directorio actual)").option("-a, --archetype <archetype>","Arquetipo base (standard, roles, plenarias)").option("-m, --modules <modules>","M\xF3dulos separados por coma (tshirt, workshops, rooms, voting)").option("-l, --languages <languages>","Idiomas (es, es-en)").option("-y, --yes","Omitir confirmaciones de destino y generaci\xF3n").action(async e=>{console.clear(),(0,d.intro)(l.default.cyan("\u{1F47E} unbj-echo \u2014 CLI de Echo")),e.archetype&&!D.includes(e.archetype)&&(console.error(l.default.red(`Error: Arquetipo inv\xE1lido "${e.archetype}". Debe ser "${D.join('", "')}".`)),process.exit(1)),e.languages&&!B.includes(e.languages)&&(console.error(l.default.red(`Error: Idioma inv\xE1lido "${e.languages}". Debe ser "${B.join('" o "')}".`)),process.exit(1));let t=e.eventName??e.event??await te(),n=ee(t),s=e.output?j.default.resolve(process.cwd(),e.output):j.default.resolve(process.cwd(),n),r=e.archetype;if(!r){let i=await(0,d.select)({message:"Selecciona el arquetipo de flujo base para el evento:",options:[{value:"standard",label:"Registro Est\xE1ndar",hint:"Formulario b\xE1sico + Pago + QR"},{value:"roles",label:"Registro por Roles / Entradas",hint:"Categor\xEDas con precios y cupos independientes"},{value:"plenarias",label:"Registro por Iglesias / Delegados",hint:"Iglesias, delegados y carta de autorizaci\xF3n"}]});typeof i=="symbol"&&y(),r=i}let c;if(e.modules!==void 0)c=e.modules?e.modules.split(",").map(i=>i.trim()).filter(Boolean):[];else{let i=await(0,d.multiselect)({message:"Selecciona los m\xF3dulos adicionales a inyectar:",options:[{value:"tshirt",label:"Tallas de Playeras",hint:"Campo de talla y estad\xEDsticas"},{value:"workshops",label:"Selecci\xF3n de Talleres",hint:"Cat\xE1logo con cupo limitado"},{value:"rooms",label:"Hospedaje y Asignaci\xF3n de Cuartos",hint:"Responsables y compa\xF1eros"},{value:"voting",label:"Votaci\xF3n en Tiempo Real",hint:"Votaciones en vivo y resultados"}],required:!1});typeof i=="symbol"&&y(),c=i}let p=c.filter(i=>!M.includes(i));p.length&&(console.error(l.default.red(`Error: M\xF3dulo(s) inv\xE1lido(s): ${p.join(", ")}. Deben ser: ${M.join(", ")}.`)),process.exit(1));let g=e.languages;if(!g){let i=await(0,d.select)({message:"\xBFEl portal de registro debe contar con soporte multi-idioma?",options:[{value:"es-en",label:"S\xED, Espa\xF1ol e Ingl\xE9s",hint:"Configura locales es/en"},{value:"es",label:"No, Solo Espa\xF1ol",hint:"Portal \xFAnicamente en espa\xF1ol"}]});typeof i=="symbol"&&y(),g=i}try{oe(s)}catch(i){(0,d.outro)(l.default.red(i.message)),process.exit(1)}if(!e.yes){console.log(`
`+l.default.cyan("\u{1F4CB} Resumen de la configuraci\xF3n:")),console.log(`  \u2022 Evento:       ${l.default.green(t)}`),console.log(`  \u2022 Carpeta:      ${l.default.green(s)}`),console.log(`  \u2022 Nombre t\xE9cnico: ${l.default.green(n)}`),console.log(`  \u2022 Arquetipo:    ${l.default.green(r)}`),console.log(`  \u2022 M\xF3dulos:      ${l.default.green(c.length?c.join(", "):"Ninguno")}`),console.log(`  \u2022 Idiomas:      ${l.default.green(g)}
`);let i=await(0,d.confirm)({message:"\xBFQuieres generar la plataforma con esta configuraci\xF3n?"});(!i||typeof i=="symbol")&&((0,d.outro)(l.default.yellow("Generaci\xF3n cancelada por el usuario.")),process.exit(0))}let u=(0,d.spinner)();u.start("Generando estructura de archivos y configuraciones...");try{await N(s,{projectName:n,eventName:t,archetype:r,modules:c,languages:g}),u.stop("\xA1Estructura base generada!")}catch(i){u.stop("Error durante la generaci\xF3n"),(0,d.outro)(l.default.red(`Ocurri\xF3 un error: ${i.message}`)),process.exit(1)}(0,d.outro)(l.default.green(`\u{1F389} Plataforma creada con \xE9xito en ${s}
`)+l.default.dim(`Siguientes pasos:
`)+l.default.dim(`  1. cd ${s}
`)+l.default.dim(`  2. pnpm install
`)+l.default.dim("  3. Sigue las instrucciones de configuraci\xF3n en README.md"))});$.parse(process.argv);
