# Bitacora de Desarrollo — unbj-echo

Este archivo registra el historial de cambios, correcciones de tipado, integraciones modulares y el estado de las validaciones del generador de plataformas de registro.

---

## Historial de Cambios e Hitos

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
