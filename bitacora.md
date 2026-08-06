# Bitacora de Desarrollo — unbj-echo

Este archivo registra el historial de cambios, correcciones de tipado, integraciones modulares y el estado de las validaciones del generador de plataformas de registro.

---

## Historial de Cambios e Hitos

### 📅 05 de Agosto, 2026 — Reenvío administrativo de enlace de acceso

#### 1. Recuperación de acceso desde el detalle de registro
* **Acción en admin:** añadida la sección **Acceso al portal** en el detalle de cada registro, con botón **Reenviar enlace** y modal de confirmación que muestra el correo registrado antes de enviar.
* **Endpoint protegido:** nuevo `POST /admin/registrations/{id}/resend-access`, disponible para los roles `admin` y `super_admin`. Reutiliza el `token` de portal existente; no genera ni invalida enlaces.
* **Correo específico:** añadido el template de recordatorio de acceso en `email-html.ts.ejs`, con asunto y contenido distintos a la confirmación inicial, enlace al portal personal y el branding del evento.

#### 2. Auditoría y manejo de errores
* Cada intento se registra en `registrations/{id}/accessLinkEmails/{attemptId}` con administrador, destinatario, fecha, resultado, ID de Resend cuando existe y detalle del error si falla.
* El documento del registro conserva el resumen de envíos exitosos: contador, fecha y administrador del último reenvío; esta información se muestra en la pantalla de detalle.
* Un fallo del proveedor de correo no incrementa el contador ni marca el reenvío como exitoso, y permite reintentar desde el panel.
* Se conserva `RESEND_DEV_TO` como protección de preview: cuando está configurada, los correos de desarrollo se redirigen a esa dirección en lugar del destinatario real.

#### 3. Validación
* Generación aislada de un proyecto `standard` con i18n `es-en` y typecheck exitoso de API, portal y admin mediante `pnpm run typecheck`.

### 📅 05 de Agosto, 2026 — Rediseño UI/UX mayor (estilo moderno minimalista)

Rediseño visual completo de las plantillas generadas **sin cambios funcionales** (mismas rutas, props, handlers, endpoints, condicionales EJS, hooks y traducciones). Solo markup, clases, tokens, tipografía, iconografía y animación.

#### 1. Fundamentos (tokens + tipografía + dependencias)
* **Nuevas dependencias en portal y admin:** `geist` (tipografía, sin fetch a Google Fonts en build) y `framer-motion` (^12, compatible React 19).
* **Tipografía:** Inter → **Geist Sans** (heading/body) + **Geist Mono** (`font-mono` para números/códigos). Actualizados `layout.tsx.ejs` de ambas apps y el layout raíz i18n que genera inline `src/utils/generator.ts` (variante `es-en`).
* **Tokens ampliados** en `globals.css` de ambas apps (light + dark): escala neutra zinc refinada, `--bg-subtle`, `--bg-sidebar-hover` unificado (antes solo admin), `success`/`warning`/`error` como CSS vars (antes hex hardcodeados en `tailwind.config.ts`), sombras por tema (`--shadow-card`, `--shadow-pop`), `::selection` con acento.
* **`tailwind.config.ts`:** nuevos tokens (`bg-subtle`, sombras, radios 10/14/20px, `font-mono`, keyframes `animate-fade-in`/`animate-fade-up`).

#### 2. Componentes UI base y primitivas nuevas (ambas apps)
* Restilados `Button` (focus-visible ring, `active:scale-[0.98]`, secondary/ghost con `bg-subtle`), `Input` (focus ring `accent/25`), `Card` (sin barra superior `h-[3px] bg-accent`; la prop `accent` de portal ahora es borde `border-accent/40`), `Monogram`, `ThemeToggle`.
* Nuevas primitivas: `components/ui/motion.tsx` (`FadeIn`, `Stagger`, `StaggerItem`, respetan `prefers-reduced-motion`), `Badge` (tones accent/success/warning/error/neutral), `Skeleton`, `EmptyState`.
* `Sidebar.tsx.ejs`: item activo con indicador de acento lateral + `bg-sidebar-hover`, header con Monogram; condicionales EJS intactos.

#### 3. Portal de registrantes
* Wizard con transición animada entre pasos (`AnimatePresence` keyed por step en `RegistroFlow.tsx.ejs`).
* Banderas emoji del selector de país → códigos ISO (`MX +52`); emoji `⚠` de ActionBlock → icono lucide `TriangleAlert`.
* `ProgressTracker`/`InfoCard` sin el motif de barra de acento ni encabezados uppercase con divisores; headings minimalistas.
* `ActionBlock.tsx.ejs`: pasteles hardcodeados (`amber-50`, `blue-50`, `indigo-50`, `rose-50`, `emerald-100`, `red-50`) → superficies translúcidas por token (`bg-warning/10`, etc.); iconos de módulos en `bg-bg-subtle`.
* `completado` y `not-found` retemizadas; header del portal ahora sticky con backdrop-blur.

#### 4. Panel admin
* `labels.ts` `STATUS_COLORS` → tokens translúcidos; `StatCard` sin pasteles (superficie card + valor en color semántico).
* Login, stats, registros (+detalle), checkin, config, admins y excepciones restiladas; `EmptyState` en excepciones; fix visual del toggle de config (`translate-x-5.5` no existía en la escala → `translate-x-[22px]`).

#### 5. Módulos (tshirt, workshops, rooms, voting)
* Los 5 componentes de módulo restilados con la misma guía: headers sticky con backdrop-blur, badges por tokens, `EmptyState`/`Skeleton` donde aplica, inputs canónicos. Modo proyector de `AdminPolls` conserva fondo oscuro intencional (`bg-bg-sidebar`/`text-on-dark`). Suscripciones `onSnapshot`, polling y transacciones intactos.

#### 6. Emails y PDF
* `email-html.ts.ejs`: stack tipográfico con Geist (fallbacks), header zinc-950, sin barra de acento, radios 10–14px, paleta zinc; estructura tabla inline-CSS conservada (compatibilidad clientes de correo).
* `pdf.ts.ejs`: paleta zinc + acento de branding; fuentes estándar conservadas (pdf-lib solo embebe StandardFonts; embeber Geist añadiría assets al template).

#### Notas
* `icon.svg.ejs` y `manifest.json.ejs` conservan el hex `#2563EB` por defecto: son assets estáticos que no pueden leer `branding.accentColor` en runtime sin cambios al generador.
* Validación por fase: `preview:refresh` + `preview:typecheck` en verde tras cada fase; matriz completa de `scripts/test-generator.mjs` como validación final.

#### Verificación post-rediseño (mismo día)
* El usuario reportó "el portal sigue igual" al abrirlo. Se verificó que los dev servers (`3100`/`3102`/`3001`, iniciados 15:16) sirven desde `preview-project/` ya regenerado, y que el HTML del portal incluye las variables de Geist y las clases nuevas: **el código servido es el rediseñado**.
* Causas identificadas del reporte: posible caché del navegador (resolver con `Cmd+Shift+R`) y que el rediseño minimalista es intencionalmente sutil en light mode (paleta zinc apenas refinada, misma estructura, Geist similar a Inter a simple vista).
* Quedó como opción abierta intensificar el rediseño si se busca un cambio visual evidente: tipografía display con más carácter, paleta más distintiva (tintes/gradientes sutiles) y layouts más ambiciosos (hero del wizard, cards con más elevación, header superior en admin).

### 📅 04 de Agosto, 2026 — Recuperación de sesión: votaciones y ajustes del generador

La sesión anterior terminó de forma abrupta. El estado fue reconstruido a partir del historial de Git y de los cambios locales conservados en el árbol de trabajo.

#### Cambios confirmados

* **Credenciales y preview:** ajustadas las credenciales usadas por el flujo de preview local.
* **Puertos de desarrollo:** normalizados los comandos y la documentación de los puertos del proyecto.
* **Redirecciones i18n:** corregida la generación de rutas y layouts para que las rutas públicas sin locale redirijan correctamente.
* **Roles de administrador:** añadido el flujo para asignar el claim de administrador (`scripts/set-admin-claim.mjs`) y corregida la integración de roles en el generador y las plantillas.
* **Carga de documentos:** corregido el manejo de autenticación y la vista de detalle de registros para la carga/consulta de documentos.
* **Módulo de votaciones:** habilitado correctamente en los proyectos generados; se actualizaron la inyección del módulo, el listado administrativo de encuestas y las vistas de administración y portal.

Los cambios anteriores quedaron registrados en los commits `d7d5ace`, `e3bfa69`, `2944976`, `4de2390`, `e5c0fd8` y `20a6f10`.

#### Cambios pendientes de confirmar

Quedaron dos cambios locales intencionales, todavía sin commit:

* **Resultados después de votar:** [VoterPanel.tsx](templates/modules/voting/apps/portal/src/app/portal/[token]/votacion/VoterPanel.tsx) muestra, tras emitir el voto, el conteo total, votos por opción, porcentaje y barras de progreso.
* **Protección contra sesgo previo al voto:** [active.ts](templates/modules/voting/packages/api/src/handlers/polls/active.ts) entrega el objeto `results` únicamente cuando el registro ya votó en esa encuesta. Antes de votar, los contadores continúan ocultos.

#### Verificación de recuperación

* `git diff --check` completado sin errores de espacios ni conflictos.
* El árbol de trabajo contiene exclusivamente los dos cambios de votación descritos arriba.

### 📅 04 de Agosto, 2026 — Rediseño Neutro UNBJ Echo

#### 1. Sistema de Diseño Neutro (desacoplamiento del branding CNBM)
* **Motivación:** La UI generada heredó el branding de un evento específico ("CXVI Reuniones Plenarias CNBM": navy `#1A1A2E`, dorados `#C8A44A`/`#E8D088`, fuente Cinzel, fechas y organización hardcodeadas). El CLI debe generar una plataforma base neutra re-temizable.
* **Config central de branding:** Creado [branding.ts.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/packages/shared/src/branding.ts.ejs) en `@unbj/shared` con `eventName`, `organization`, `dates`, `tagline`, `accentColor`, `accentHoverColor` y `logoInitials`. Cambiar este archivo re-temiza portal, admin, emails y PDFs.
* **Tokens semánticos + CSS variables:** `tailwind.config.ts` de portal y admin ahora mapean todos los colores a `rgb(var(--token))` con valores en `globals.css` (`:root` y `.dark`). El acento se inyecta desde `branding.accentColor` vía `<style>` en el layout raíz.
* **Dark mode:** Integrado `next-themes` (`darkMode: 'class'`) en portal y admin; nuevo componente `ThemeToggle.tsx` en `components/ui/` de ambas apps.
* **Tipografía única Inter:** Eliminada Cinzel; Inter para heading y body en ambas apps.
* **Monograma:** Nuevo `Monogram.tsx` (iniciales del evento sobre acento) y favicons `icon.svg.ejs` generados con la nueva variable EJS `initials` en [generator.ts](file:///Users/raulcanul/Documents/Dev/platform-register/src/utils/generator.ts).
* **Footer de plataforma:** `© UNBJ {año} - Un latir por el Reino` (constante `platformFooter` en shared), reemplazando "© 2026 CNBM".

#### 2. Limpieza Estructural de Arquetipos
* **Descubrimiento clave:** `renderTemplates` se ejecuta DESPUÉS de copiar los arquetipos y pisa cualquier archivo cuyo nombre coincida con un `.ejs` de base. Los 22 "overrides" de `templates/archetypes/plenarias/` (layout, ActionBlock, Sidebar, email-html, pdf, nomination, create, serverless.yml, etc.) eran **código muerto**: nunca llegaban al proyecto generado. Eliminados todos; el arquetipo plenarias ahora solo contiene archivos vivos nuevos (Step1Iglesia, handlers de churches/carta/exceptions).
* **Regla documentada en CLAUDE.md:** las variantes por arquetipo viven en condicionales `<% if (archetype === ...) %>` de los `.ejs` base; los arquetipos solo aportan archivos nuevos.
* **Paquete `@plenarias/emails` eliminado** (no era referenciado por nada; la API usa `email-html.ts`).

#### 3. Migración a Tokens (portal, admin, módulos)
* **Portal:** Reescrito `registro/layout.tsx` (header minimal con Monogram + eventName + ThemeToggle, sin split-screen navy/dorado ni ornamentos). Migrados a tokens: `completado`, `not-found`, `PortalView`, `ActionBlock.tsx.ejs`, `InfoCard`, `ProgressTracker`, `StripePaymentForm` (colorPrimary desde branding), `StepIndicator.tsx.ejs`, `Button`, `Card`, `Footer`.
* **Admin:** `Button` primary a tokens; eliminada prop `accent` dorada de `Card` y componente `Footer` muerto; `layout.tsx` → `layout.tsx.ejs` (metadata desde `eventName` + ThemeProvider); `manifest.json` → `manifest.json.ejs`; login con Monogram + `branding.eventName`; CSV `registros.csv`.
* **Módulos unificados:** tshirt (azul), rooms/workshops (slate) y voting (rose) migrados a los mismos tokens semánticos; `AdminPolls` y proyector incluidos.
* **Emails/PDF:** `email-html.ts.ejs` usa `branding.accentColor` y firma "Generado por UNBJ Echo"; `pdf.ts.ejs` pinta la franja del pase con el acento de branding (helper `hexToRgb` en shared).

#### 4. Renombre de Scope y Restos de Marca
* **`@plenarias/*` → `@unbj/*`** en 36 archivos (package.json, imports, transpilePackages).
* Eliminado `templates/base/CHANGELOG.md` (historia del proyecto origen que se copiaba al generado).
* `setup-super-admin.mjs` (×2): email default `plenarias.cnbm@gmail.com` → `admin@example.com`.
* CLI: placeholder de evento "Plenarias Anuales 2026" → "Congreso Anual 2026"; label del arquetipo "Registro Plenarias CNBM" → "Registro por Iglesias / Delegados".

#### 5. Validación
* Matriz del generador (`node scripts/test-generator.mjs`): roles+es-en+todos los módulos, plenarias+es-en+todos, standard+es — **100% typecheck en los 3 escenarios**.
* **Fix de build del admin:** `getAuth()` se inicializaba a nivel módulo en `apps/admin/src/lib/firebase.ts` y lanzaba `auth/invalid-api-key` durante el prerender de `next build` cuando las credenciales Firebase son placeholders (`.env.local` del preview). Se hizo perezoso (`getAuthInstance()`) con su único consumidor actualizado (`src/lib/auth.tsx`), de modo que el proyecto generado compila de fábrica sin credenciales reales.

#### 6. Correcciones de Contraste en Dark Mode (post-rediseño)
Detectadas en revisión visual del preview con dark mode activo; patrón común: **fondo claro fijo + texto adaptativo** (`text-text-primary`, que se vuelve casi blanco en dark) = contenido ilegible.

* **Confirmación de convención/iglesia** ([Step1Iglesia.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/archetypes/plenarias/apps/portal/src/components/registro/Step1Iglesia.tsx)): los cuadros de "seleccionado" usaban `bg-green-50` fijo → migrados a `bg-success/10 border-success/30` (superficie translúcida que funciona en ambos temas).
* **Formulario de datos personales** ([Step2Datos.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/components/registro/Step2Datos.tsx)): el `<select>` de código de país usaba `bg-white` fijo → `bg-bg-card`.
* **Botón "Atrás" / variante `secondary`** (`components/ui/Button.tsx` de portal y admin): `bg-white hover:bg-gray-50` → `bg-bg-card hover:bg-bg-page`.
* **Barrido del patrón `bg-white` en admin:** selects/inputs de `admins` y `registros`, y botón "Escanear siguiente" de `checkin` → `bg-bg-card`.
* **Tarjeta de resultado del check-in** ([checkin/page.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/admin/src/app/(dashboard)/checkin/page.tsx)): estados (válido / ya registrado / inválido / sin conexión) migrados de fondos fijos `green-50`/`yellow-50`/`red-50`/`gray-50` a superficies adaptativas `bg-success/10`, `bg-warning/10`, `bg-error/10`, `bg-bg-page` con iconos/títulos en tokens; panel interno `bg-white/70` → `bg-bg-card/70`; hover del botón de escáner `hover:bg-blue-50` → `hover:bg-accent/10`.
* **Detalle de registro en admin** ([registros/[id]/page.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/admin/src/app/(dashboard)/registros/[id]/page.tsx)): cuadro de revisión de carta `bg-blue-50` → `bg-accent/10 border-accent/30`; cuadro de pago en efectivo `bg-yellow-50` → `bg-warning/10 border-warning/30`; mensajes de error `bg-red-50` → `bg-error/10`.
* **Regla de diseño derivada:** nunca combinar fondos estáticos claros (`*-50`, `bg-white`) con texto por tokens (`text-text-primary`); los cuadros de estado deben usar superficies translúcidas (`bg-{token}/10`) o texto estático oscuro.
* **Pendiente conocido (no bloqueante):** los cuadros de estado con texto oscuro fijo (`bg-green-50` + `text-green-800` en módulos, ActionBlock y registros) son legibles en dark mode pero conservan apariencia clara; candidatos a un pase futuro de estilo dark nativo.
* **Validación:** `npm run preview:typecheck` en verde tras todos los cambios; fixes aplicados también en caliente sobre `preview-project/`.

### 📅 04 de Agosto, 2026

#### 1. Correcciones de Preview Local y Routing i18n
* **Estructura de layouts en portal (`es-en`):**
  * Corregido el árbol de App Router para evitar errores de DOM como `HierarchyRequestError` y `NotFoundError` causados por múltiples elementos raíz del documento.
  * Ajustado [layout.tsx.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/app/layout.tsx.ejs) para que el layout por locale no renderice `<html>` ni `<body>`.
  * Ajustado [generator.ts](file:///Users/raulcanul/Documents/Dev/platform-register/src/utils/generator.ts) para generar un `app/layout.tsx` raíz válido en el preview i18n.
* **Middleware de `next-intl`:**
  * Corregido el `matcher` para cubrir rutas sin locale y evitar que `/registro` o rutas equivalentes queden fuera del middleware y respondan con `404`.
* **Aliases explícitos para rutas sin locale:**
  * Añadidas rutas raíz para el portal multi-idioma:
    * `/` -> `/es/registro`
    * `/registro` -> `/es/registro`
    * `/registro/completado` -> `/es/registro/completado`
    * `/portal/[token]` -> `/es/portal/[token]`
  * Motivo: dejar el preview más robusto y no depender exclusivamente del middleware para las rutas públicas principales.

#### 2. Flujo de Regeneración del Preview
* **Protección de borrado durante desarrollo:**
  * Ajustado [preview-project.mjs](file:///Users/raulcanul/Documents/Dev/platform-register/scripts/preview-project.mjs) para detectar procesos activos en los puertos del preview (`3100`, `3102`, `3001`) antes de ejecutar `clean` o `refresh`.
  * Esto evita errores parciales al intentar borrar `.next/` o el proyecto regenerado mientras `next dev` o `serverless offline` siguen corriendo.

#### 3. Validación Ejecutada
* **Auditoría de fronts del preview:**
  * `portal`: verificados redirects y páginas principales (`/`, `/registro`, `/es/registro`, `/en/registro`).
  * `admin`: verificados redirects y páginas principales (`/`, `/login`, `/registros`, `/admins`, `/checkin`, `/config`, `/votaciones`, `/excepciones`, `/stats`, `/registros/[id]`).
* **Builds de producción:**
  * `pnpm --dir preview-project run build:portal` -> exitoso.
  * `pnpm --dir preview-project run build:admin` -> exitoso.
* **Resultado:**
  * No se reprodujeron errores equivalentes de App Router/layout en `portal` ni en `admin` tras las correcciones.

### 📅 01 de Julio, 2026

#### 1. Conclusión de Feature Flags y Validación de Compilación
* **Ajustes y Cierre:**
  * **Integración del Hook:** Resuelto error de tipado inyectando `const flags = useFeatureFlags()` en el componente auxiliar `ApprovedBlock` de [ActionBlock.tsx.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/components/portal/ActionBlock.tsx.ejs).
  * **Estructura Base:** Confirmada la correcta envoltura de la aplicación en [layout.tsx.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/app/layout.tsx.ejs) mediante el `FeatureFlagsProvider`.
* **Archivos Afectados por la Migración:**
  * *Nuevos / Configuración:*
    * [useTranslations.ts.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/hooks/useTranslations.ts.ejs) (Traductor unificado para Next-Intl/fallbacks)
    * [features.config.ts.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/config/features.config.ts.ejs) (Banderas build-time)
    * [FeatureFlagsContext.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/context/FeatureFlagsContext.tsx) (Banderas runtime / Firestore)
  * *Componentes de Módulos (Convertidos a TSX estático sin EJS):*
    * [ShirtSizeSelector.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/tshirt/apps/portal/src/components/shirt-size/ShirtSizeSelector.tsx)
    * [WorkshopsSelector.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/workshops/apps/portal/src/app/portal/[token]/talleres/WorkshopsSelector.tsx)
    * [RoomManager.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/rooms/apps/portal/src/app/portal/[token]/habitaciones/RoomManager.tsx)
    * [VoterPanel.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/voting/apps/portal/src/app/portal/[token]/votacion/VoterPanel.tsx)
* **Resultados de Matriz de Pruebas:**
  * Verificados y aprobados todos los escenarios del generador (`pnpm run typecheck` en monorrepo generado):
    1. *Roles completo* (es-en + todos los módulos): **Exitoso (100% compila)**
    2. *Plenarias completo* (es-en + todos los módulos): **Exitoso (100% compila)**
    3. *Standard simple* (es + sin módulos): **Exitoso (100% compila)**

### 📅 29 de Junio, 2026

#### 1. Análisis y Diseño para Feature Flags
* **Evaluación de Feature Flags:** Se completó el análisis de arquitectura detallado en el artefacto [analisis_feature_flags.md](file:///Users/raulcanul/.gemini/antigravity-cli/brain/4864f388-8dec-4a0d-9a4a-4ec36da0e3ab/analisis_feature_flags.md).
* **Definición de Modelo Híbrido:** Aprobado el diseño para mantener arquetipos estáticos (EJS) y modularizar las piezas opcionales (`tshirt`, `workshops`, `rooms`, `voting`) mediante banderas en runtime (Firestore).
* **Plan de Migración:** Completada la migración de Feature Flags en esta sesión.

#### 2. Implementación de Feature Flags
* **Traductor Unificado:** Creado [useTranslations.ts.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/hooks/useTranslations.ts.ejs) para unificar `next-intl` y el fallback en español, permitiendo eliminar el EJS condicional de traducciones en los módulos.
* **Limpieza de EJS en Módulos:** Convertidos los componentes `.tsx.ejs` a archivos `.tsx` estáticos de TypeScript puro en todos los módulos opcionales:
  * [ShirtSizeSelector.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/tshirt/apps/portal/src/components/shirt-size/ShirtSizeSelector.tsx)
  * [WorkshopsSelector.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/workshops/apps/portal/src/app/portal/[token]/talleres/WorkshopsSelector.tsx)
  * [RoomManager.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/rooms/apps/portal/src/app/portal/[token]/habitaciones/RoomManager.tsx)
  * [VoterPanel.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/voting/apps/portal/src/app/portal/[token]/votacion/VoterPanel.tsx)
* **FeatureFlagsProvider:** Creado [FeatureFlagsContext.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/context/FeatureFlagsContext.tsx) y la plantilla de configuración [features.config.ts.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/portal/src/config/features.config.ts.ejs) para gestionar las banderas tanto en build-time como runtime (Firestore).
* **Adaptación del Generador CLI:** Modificado [generator.ts](file:///Users/raulcanul/Documents/Dev/platform-register/src/utils/generator.ts) para inyectar incondicionalmente todos los módulos e i18n al generar el proyecto, permitiendo la activación dinámica de características en runtime.
* **Validación de la Matriz de Pruebas:** Ejecutado exitosamente el validador, logrando una cobertura del 100% en compilación y type-check (`tsc --noEmit`) en todos los escenarios.


### 📅 19 de Junio, 2026

#### 1. Inyección de Características y Corrección de Tipado (Type Safety)
* **Página de Detalle en Admin:** Corregidos errores `TS2322` en [registros/[id]/page.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/apps/admin/src/app/(dashboard)/registros/[id]/page.tsx) agregando fallbacks para `churchName` y `conventionName` en los componentes `InfoRow`.
* **Desglose de Monorepo Inteligente:** Modificado [split-monorepo.mjs](file:///Users/raulcanul/Documents/Dev/platform-register/scripts/split-monorepo.mjs) para:
  * Inyectar automáticamente la exportación `db` en `apps/portal/src/lib/firebase.ts` (Paso 12).
  * Flexibilizar la interfaz `CreateRegistrationInput` en `apps/portal/src/lib/api.ts` haciendo opcionales los campos específicos de arquetipos e introduciendo `ticketTier` (Paso 13).
  * Aplicar fallbacks de tipo en `apps/portal/src/components/portal/InfoCard.tsx` (Paso 14).
  * Limpiar archivos redundantes en el arquetipo de `plenarias` (como `auth.ts`, `firebase.ts` e `InfoCard.tsx`) para evitar colisiones y sobrescrituras sobre las plantillas inyectadas en la base.
* **Componente Step2Tier:** Removido código muerto de variables de estado con errores de tipado `TS2339` en [Step2Tier.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/archetypes/roles/apps/portal/src/components/registro/Step2Tier.tsx).
* **Compatibilidad de Constantes:** Exportada incondicionalmente la constante `DELEGATE_TYPE_LABELS` en [constants.ts.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/base/packages/shared/src/constants.ts.ejs).

#### 2. Adaptación i18n para Módulos Opcionales (Puzzle Pieces)
Adaptados los cuatro módulos opcionales a fin de admitir traducciones dinámicas con soporte tanto para `next-intl` (modo multi-idioma) como para diccionarios locales de fallback (modo español único):
* **Playeras:** Creado [ShirtSizeSelector.tsx.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/tshirt/apps/portal/src/components/shirt-size/ShirtSizeSelector.tsx.ejs) y removido su duplicado estático.
* **Votación:** Creado [VoterPanel.tsx.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/voting/apps/portal/src/app/portal/[token]/votacion/VoterPanel.tsx.ejs) y removido su duplicado estático.
* **Talleres:** Creado [WorkshopsSelector.tsx.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/workshops/apps/portal/src/app/portal/[token]/talleres/WorkshopsSelector.tsx.ejs) y removido su duplicado estático.
* **Hospedaje:** Creado [RoomManager.tsx.ejs](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/rooms/apps/portal/src/app/portal/[token]/habitaciones/RoomManager.tsx.ejs) y removido su duplicado estático.
* **Diccionarios Dinámicos i18n:** Actualizada la función `configureI18n` en [generator.ts](file:///Users/raulcanul/Documents/Dev/platform-register/src/utils/generator.ts) para añadir diccionarios de traducción estructurados en `es.json` y `en.json` dinámicamente según los módulos seleccionados.

---

## Matriz de Cobertura de Pruebas

Para garantizar que el generador es completamente estable, implementamos una matriz de escenarios de validación en [test-generator.mjs](file:///Users/raulcanul/Documents/Dev/platform-register/scripts/test-generator.mjs). 

Cada escenario ejecuta la compilación del CLI, genera el proyecto, realiza la instalación de paquetes (`pnpm install`) y corre la verificación de tipos TypeScript (`pnpm run typecheck` / `tsc --noEmit`):

| Escenario | Arquetipo | Idiomas | Módulos Opcionales | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **1. Roles completo** | `roles` | `es-en` | `tshirt,workshops,rooms,voting` | **Exitoso (100% compila)** |
| **2. Plenarias completo** | `plenarias` | `es-en` | `tshirt,workshops,rooms,voting` | **Exitoso (100% compila)** |
| **3. Standard simple** | `standard` | `es` | *Ninguno* | **Exitoso (100% compila)** |

---

## Archivos Clave del Generador

* **[index.ts](file:///Users/raulcanul/Documents/Dev/platform-register/src/index.ts):** Manejo de parámetros de línea de comandos y flujo de preguntas del CLI.
* **[generator.ts](file:///Users/raulcanul/Documents/Dev/platform-register/src/utils/generator.ts):** Generador del monorrepo, inyección de dependencias, configuración de i18n y compilación de plantillas EJS.
* **[split-monorepo.mjs](file:///Users/raulcanul/Documents/Dev/platform-register/scripts/split-monorepo.mjs):** Extracción, limpieza y parametrización de archivos base del proyecto origen.
* **[test-generator.mjs](file:///Users/raulcanul/Documents/Dev/platform-register/scripts/test-generator.mjs):** Ejecución de la matriz de pruebas de tipado y compilación.
### 📅 06 de Agosto, 2026 — Endurecimiento y rendimiento

- Se sustituyó el polling de votaciones por listeners Firestore: el portal escucha la votación activa y resultados cerrados, y el panel admin escucha el conteo activo. La API emite una sesión Firebase temporal y las reglas exponen sólo proyecciones mínimas.
- Se versionó `storage.cors.json` para permitir las cargas por URL firmada desde los puertos locales del portal; el bucket debe recibir esa política con `gsutil cors set`.
- Se corrigieron los flujos sensibles: Storage queda sin acceso directo, cartas mediante URL firmada de corta vida/ruta canónica, respuestas del portal por DTO explícito, expiración de enlaces nuevos y rate limiting para los endpoints de mayor riesgo.
- Se agregaron reglas e índices Firestore versionados, CORS de orígenes explícitos, cabeceras de seguridad, escape de HTML/CSV, paginación por cursor, caché breve de flags/estadísticas y límites de Lambda.
- Validación: se generó un proyecto Plenarias completo y `pnpm run typecheck` finalizó correctamente.
