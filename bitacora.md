# Bitacora de Desarrollo — unbj-echo

Este archivo registra el historial de cambios, correcciones de tipado, integraciones modulares y el estado de las validaciones del generador de plataformas de registro.

---

## Historial de Cambios e Hitos

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
