# unbj-echo CLI · Guia de Contexto y Desarrollo

Este archivo documenta los comandos de desarrollo, arquitectura y estado del proyecto para facilitar la continuidad en sesiones de desarrollo posteriores.

---

## 1. Comandos de Desarrollo del CLI

* **Compilar CLI:** `npm run build` (compila `src/index.ts` a `dist/index.js` usando `tsup`)
* **Desarrollo en vivo (Watch):** `npm run dev`
* **Ejecutar CLI interactivamente:** `node dist/index.js`
* **Ejecutar CLI con flags (Atajo/No interactivo):** `node dist/index.js -n <carpeta> -e "<Evento>" -a <archetype> -m <modules> -l <languages> -y`
  * *Ejemplo:* `node dist/index.js -n mi-proyecto -e "Congreso 2026" -a standard -m tshirt,voting -l es-en -y`
* **Ejecutar pruebas de compilación automática:** `node scripts/test-generator.mjs` (genera un proyecto de prueba completo, instala dependencias y verifica tipos TS)
* **Regenerar preview local:** `npm run preview:refresh` (recrea `preview-project/` con `plenarias` + todos los módulos + `es-en`, e instala dependencias)
* **Verificar preview local:** `npm run preview:typecheck`
* **Levantar preview local:** `npm run preview:dev:portal` (puerto `3100`), `npm run preview:dev:admin` (puerto `3102`), `npm run preview:dev:api` (puerto `3001`)
* **Limpiar y separar plantilla base desde el proyecto origen:** `node scripts/split-monorepo.mjs`

---

## 2. Tecnologías y Arquitectura Target

El CLI genera un **Monorepo** con la siguiente arquitectura:
* **Package Manager:** `pnpm workspaces`
* **Backend:** Serverless Framework en AWS Lambda (TypeScript, Node.js 20).
* **Base de Datos:** Firebase Firestore (con transacciones `db.runTransaction` para consistencia).
* **Storage y Auth:** Firebase JS SDK y Firebase Admin SDK.
* **Portal de Registrantes:** Next.js (Tailwind CSS, `next-intl` para i18n).
* **Panel Administrador:** Next.js (Tailwind CSS, Firebase Auth).
* **Pasarela de Pago:** Stripe (Payment Elements para tarjeta y OXXO).
* **Correos:** Resend.

---

## 3. Estructura de Plantillas (Templates)

### A. Base (`templates/base/`)
Monorepo común para todos los proyectos generados:
* `packages/api/serverless.yml.ejs` (configuración Serverless dinámica).
* `packages/api/src/handlers/registrations/create.ts.ejs` (registro inicial dinámico).
* `packages/api/src/handlers/payments/webhook.ts.ejs` (webhook de Stripe dinámico).
* `packages/api/src/handlers/admin/stats.ts.ejs` (estadísticas dinámicas).
* `packages/api/src/handlers/admin/update-payment.ts.ejs` (aprobación de pagos en efectivo).
* `packages/api/src/lib/nomination.ts.ejs` y `pdf.ts.ejs` (generación de pases en PDF).
* `apps/portal/src/components/portal/ActionBlock.tsx.ejs` (inyección dinámica de módulos en el portal).
* `apps/portal/src/components/registro/RegistroFlow.tsx.ejs` (pasos dinámicos del wizard de registro).
* `apps/portal/src/components/registro/StepIndicator.tsx.ejs` (barra de progreso dinámica).
* `apps/portal/src/components/registro/Step3Confirmacion.tsx.ejs` (confirmación de registro dinámica).
* `apps/admin/src/components/admin/Sidebar.tsx.ejs` (menú de navegación administrativo dinámico).

### B. Arquetipos (`templates/archetypes/`)
* **`standard`:** Registro simple (Información $\rightarrow$ Pago $\rightarrow$ Pase de entrada). Sin overrides; vive en los condicionales EJS de base.
* **`roles`:** Registro por entradas/categorías. Solo contiene [Step2Tier.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/archetypes/roles/apps/portal/src/components/registro/Step2Tier.tsx) para la selección de niveles de acceso (VIP, Estudiante, General).
* **`plenarias`:** Flujo CNBM original (Búsqueda de iglesias, acreditación de delegados mediante cartas, límite de cupos). Solo contiene archivos **nuevos** sin contraparte en base: `Step1Iglesia.tsx` y los handlers de `churches/`, `registrations/carta-*` y `admin/update-carta.ts`, `update-delegate-type.ts`, `exceptions.ts`.

> **Importante (render EJS):** el generador copia base → arquetipo → módulos y **después** renderiza los `.ejs`, que se escriben sin extensión y **pisan cualquier archivo del arquetipo con el mismo nombre** (ej. un `layout.tsx` en el arquetipo es sobrescrito por el `layout.tsx.ejs` de base). Por eso los arquetipos solo deben contener archivos nuevos; las variantes por arquetipo van en condicionales `<% if (archetype === '...') %>` dentro de los `.ejs` de base.

### C. Módulos ("Puzzle Pieces" en `templates/modules/`)
* **`tshirt`:**
  * Endpoint: `/users/shirt-size/status` y `/users/shirt-size/select`
  * Frontend: [ShirtSizeSelector.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/tshirt/apps/portal/src/components/shirt-size/ShirtSizeSelector.tsx)
* **`workshops`:**
  * Endpoints: `/logistic/studios` (lista), `/logistic/my-studios` (mis talleres), `/logistic/studios/select` (inscribir con transacciones).
  * Frontend: Pestañas de días (Martes a Jueves) en `/portal/[token]/talleres`.
* **`rooms`:**
  * Endpoints: `/logistic/rooms/status`, `/logistic/rooms/create`, `/logistic/rooms/join`, `/logistic/rooms/requests`, `/logistic/rooms/requests/respond` y `/logistic/rooms/leave`.
  * Frontend: Gestión completa de hospedaje por invitaciones y códigos en `/portal/[token]/habitaciones`.
* **`voting`:**
  * Endpoints de votante: `/polls/active` y `/polls/vote`.
  * Endpoints de administración: `/admin/polls` (crear, listar) y `/admin/polls/{id}/toggle` (activar/cerrar).
  * Frontend: Panel de votación en tiempo real (`onSnapshot`) en `/portal/[token]/votacion` y pantalla de proyector en admin `/votaciones`.

---

## 4. Guía de Convenciones y Código

* **EJS Compilation:** Los archivos con extensión `.ejs` son renderizados dinámicamente y renombrados a su versión estándar (ej. `create.ts.ejs` $\rightarrow$ `create.ts`). Variables disponibles: `projectName`, `eventName`, `initials`, `archetype`, `languages`, `modules`, `moduleEndpointsYaml`.
* **Sistema de diseño neutro (UNBJ Echo):** El proyecto generado NO lleva branding de ningún evento específico.
  * **Config central:** `packages/shared/src/branding.ts` (generado desde `branding.ts.ejs`) define `eventName`, `organization`, `dates`, `tagline`, `accentColor`, `accentHoverColor` y `logoInitials`. Cambiar este archivo re-temiza portal, admin, emails y PDFs.
  * **Tokens semánticos:** Portal y admin usan colores semánticos de Tailwind (`accent`, `bg-page`, `bg-card`, `text-primary`, `text-secondary`, `border`, etc.) mapeados a CSS variables en `globals.css` (`:root` y `.dark`). Nunca hardcodear hex en componentes; usar siempre tokens.
  * **Dark mode:** `next-themes` con `darkMode: 'class'`; toggle en `components/ui/ThemeToggle.tsx` de cada app. El color de acento se inyecta desde `branding.accentColor` vía `<style>` en el layout raíz.
  * **Tipografía:** Inter (next/font) para heading y body. No hay otras fuentes.
  * **Logo:** monograma con iniciales del evento (`components/ui/Monogram.tsx` + `icon.svg` generado). El footer de plataforma es `© UNBJ {año} - Un latir por el Reino` (constante `platformFooter` en shared).
  * **Regla de contraste:** nunca combinar fondos estáticos claros (`bg-white`, `*-50` de Tailwind) con texto por tokens (`text-text-primary`, que es claro en dark mode). Los cuadros de estado deben usar superficies translúcidas (`bg-success/10`, `bg-warning/10`, `bg-error/10`, `bg-accent/10`) con texto/icono en el mismo token, o texto estático oscuro.
* **Naming de paquetes:** El scope de los paquetes internos es `@unbj/*` (`@unbj/shared`, `@unbj/api`).
* **Firestore Transactions:** Para mantener la consistencia en el entorno serverless y evitar race conditions en cupos (talleres o habitaciones), se utiliza `db.runTransaction` de Firebase Admin.
* **Real-time con Serverless:** La votación en tiempo real evita WebSockets tradicionales (como Socket.io) utilizando en su lugar suscripciones reactivas nativas de Firebase client mediante `onSnapshot` conectados al documento único `/polls/active`.

---

## 5. Preview Local

Para acelerar el ciclo de desarrollo de `templates/` y del wiring del generador, el repo mantiene un preview regenerable local en `preview-project/`.

* **Fuente de verdad:** `preview-project/` no debe editarse manualmente como si fuera código fuente; cualquier cambio real debe hacerse en `src/` o `templates/`, y luego regenerarse.
* **Configuración fija del preview:** `plenarias` + `tshirt,workshops,rooms,voting` + `es-en`.
* **Archivos de entorno:** `preview:refresh` genera `packages/api/.env`, `apps/portal/.env.local` y `apps/admin/.env.local` con valores locales mínimos para arrancar el entorno de preview.
* **Flujo recomendado:**
  1. `npm run preview:refresh`
  2. `npm run preview:typecheck`
  3. Levantar las apps necesarias con `npm run preview:dev:*`
* **Puertos del preview:** Portal `http://localhost:3100`, Admin `http://localhost:3102`, API `http://localhost:3001`.
* **Nota:** Los archivos generados permiten arrancar los servidores, pero para flujos reales de Firebase, Stripe y Resend debes reemplazar los placeholders por credenciales válidas.

### Estado actual del preview

Al 4 de agosto de 2026, el preview quedó ajustado para cubrir varios problemas detectados durante la auditoría del proyecto generado:

* **Protección contra regeneración con procesos vivos:** `scripts/preview-project.mjs` ahora detecta listeners activos en `3100`, `3102` y `3001`, y falla con mensaje claro antes de borrar `preview-project/`.
* **Layout i18n corregido en portal:** en la variante `es-en`, el layout raíz de App Router vuelve a ser el único que renderiza `<html>` y `<body>`. El layout por locale solo envuelve providers (`NextIntlClientProvider`, `FeatureFlagsProvider`).
* **Middleware i18n ampliado:** el matcher del middleware del portal cubre rutas sin locale y evita que `/registro` caiga en `404` por omisión del middleware.
* **Aliases explícitos para rutas sin locale:** además del middleware, el generador crea rutas raíz que redirigen a la variante por defecto:
  * `/` -> `/es/registro`
  * `/registro` -> `/es/registro`
  * `/registro/completado` -> `/es/registro/completado`
  * `/portal/[token]` -> `/es/portal/[token]`
* **Resultado esperado del portal preview:** aunque el proyecto esté configurado con `es-en`, URLs sin prefijo de idioma deben seguir funcionando por redirección.

### Nota operativa sobre `preview:refresh`

`npm run preview:refresh` regenera por completo `preview-project/` y reescribe los `.env` base del preview.

* Si quieres validar que el generador produce un proyecto limpio con los últimos fixes, sí conviene correrlo.
* Si ya cargaste credenciales reales dentro de `preview-project/packages/api/.env`, `apps/portal/.env.local` o `apps/admin/.env.local`, debes respaldarlas antes o volver a ponerlas después del refresh.
