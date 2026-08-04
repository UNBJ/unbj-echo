# Bitacora de Desarrollo — unbj-echo CLI
## Estado Actual de la Implementación (Fase 1, 2, 3 y 4 Completadas)

Este documento detalla el estado actual del generador `unbj-echo` (CLI) tras completar la integracion de todos los modulos opcionales de tipo "rompecabezas" y realizar las pruebas end-to-end de scaffolding.

---

## 1. Estructura de Directorios del CLI y Módulos

La siguiente estructura representa el estado fisico de los archivos organizados en la ruta local `/Users/raulcanul/Documents/Dev/platform-register`:

```
unbj-echo/
├── package.json              # Dependencias del CLI y scripts de compilación
├── tsconfig.json             # Configuración del compilador TypeScript
├── dist/                     # Código compilado del CLI listo para ejecución
│   └── index.js
├── scripts/                  # Scripts de automatización y mantenimiento de plantillas
│   └── split-monorepo.mjs    # Divide los archivos en base común y arquetipo específico
├── src/                      # Código fuente del CLI
│   ├── index.ts              # Flujo interactivo de prompts y entry point
│   └── utils/
│       └── generator.ts      # Utilidades de copiado, inyección y renderizado EJS
└── templates/                # Plantillas utilizadas para generar nuevos proyectos
    ├── base/                 # Monorepo común (Next.js apps, shared types, base API)
    │   ├── package.json
    │   ├── pnpm-workspace.yaml
    │   ├── tsconfig.base.json
    │   ├── apps/
    │   │   ├── portal/       # Portal de Registrantes Next.js común
    │   │   │   └── src/components/portal/ActionBlock.tsx.ejs # Inyección dinámica de módulos
    │   │   └── admin/        # Panel de Administración Next.js común
    │   │       └── src/components/admin/Sidebar.tsx.ejs      # Sidebar dinámico por arquetipo/módulo
    │   └── packages/
    │       ├── shared/       # Tipos y constantes comunes
    │       │   └── src/types/registration.ts.ejs # Propiedades dinámicas de la entidad
    │       └── api/          # Funciones Serverless en AWS Lambda comunes
    │           ├── serverless.yml.ejs # Plantilla de endpoints dinámica
    │           └── src/
    │               ├── handlers/
    │               │   ├── admin/
    │               │   │   ├── update-payment.ts.ejs # Aprobación de efectivo dinámica
    │               │   │   └── stats.ts.ejs          # Estadísticas dinámicas por arquetipo
    │               │   ├── registrations/
    │               │   │   └── create.ts.ejs         # Registro básico dinámico
    │               │   └── payments/
    │               │       └── webhook.ts.ejs        # Webhook de Stripe dinámico
    │               └── lib/
    │                   ├── nomination.ts.ejs     # Generación de pase de entrada
    │                   └── pdf.ts.ejs            # Generación de PDF de acceso dinámico
    ├── archetypes/
    │   ├── plenarias/        # Archivos específicos de Plenarias (iglesias, cartas, etc.)
    │   └── roles/            # Archivos específicos de Roles (selección de entradas/tiers)
    │       └── apps/portal/src/components/registro/Step2Tier.tsx
    └── modules/              # Piezas del Rompecabezas (Inyectables en compilación)
        ├── tshirt/           # Módulo: Tallas de Playeras (T-Shirt Selector)
        │   ├── inject-config.json # Registro de endpoints en Serverless
        │   ├── apps/portal/src/components/shirt-size/ShirtSizeSelector.tsx # Frontend
        │   └── packages/api/src/handlers/users/   # Handlers status & select talla
        ├── workshops/        # Módulo: Selección de Talleres (Workshops)
        │   ├── inject-config.json
        │   ├── apps/portal/src/app/portal/[token]/talleres/ # Frontend e interfaz
        │   └── packages/api/src/handlers/workshops/ # Handlers cupos con transacciones
        └── rooms/            # Módulo: Hospedaje y Habitaciones (Lodging / Rooms)
        │   ├── inject-config.json
        │   ├── apps/portal/src/app/portal/[token]/habitaciones/ # Frontend y solicitudes
        │   └── packages/api/src/handlers/rooms/     # Handlers de creación, unión y salida
        └── voting/           # Módulo: Votación en Tiempo Real (Real-time Voting)
            ├── inject-config.json
            ├── apps/portal/src/app/portal/[token]/votacion/ # Interfaz de voto en tiempo real
            ├── apps/admin/src/app/(dashboard)/votaciones/ # Proyector de administrador en tiempo real
            └── packages/api/src/handlers/polls/     # Handlers de votación y control de propuestas
```

---

## 2. Detalle de Módulos (Puzzle Pieces) Implementados

### A. Módulo: Tallas de Playeras (T-shirt)
* **API:** `GET /users/shirt-size/status` (valida pago y recupera la talla guardada) y `POST /users/shirt-size/select` (actualiza la talla de playera en Firestore).
* **Frontend:** [ShirtSizeSelector.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/tshirt/apps/portal/src/components/shirt-size/ShirtSizeSelector.tsx) dibuja tarjetas de selección para tallas (XS a 3XL) en el portal, inyectándose en el bloque del pase de acceso si el módulo está activo.

### B. Módulo: Selección de Talleres (Workshops)
* **API:** `GET /logistic/studios` (talleres disponibles y estados de cupo), `GET /logistic/my-studios` (recupera talleres del usuario) y `POST /logistic/studios/select` (inscribe en talleres restando cupo en una **Transacción Firestore** para evitar sobrecupo).
* **Frontend:** [WorkshopsSelector.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/workshops/apps/portal/src/app/portal/[token]/talleres/WorkshopsSelector.tsx) provee un selector interactivo por pestañas de días (Martes, Miércoles, Jueves), controlando límites de inscripción y bloqueos de pago pendiente de forma responsiva.

### C. Módulo: Hospedaje y Habitaciones (Rooms)
* **API:** Handlers para obtener estado (`status`), crear habitación con código autogenerado (`create`), solicitar unirse por código (`join`), listar solicitudes pendientes (`requests`), responder aprobando o rechazando (`respond`) y salir de la habitación (`leave`) transfiriendo el liderazgo automáticamente si quedan integrantes. Toda la consistencia se maneja mediante transacciones Firestore en AWS Lambda.
* **Frontend:** [RoomManager.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/rooms/apps/portal/src/app/portal/[token]/habitaciones/RoomManager.tsx) ofrece una experiencia premium para crear habitaciones configurando capacidad y restricciones de género, copiar el código al portapapeles y permitir que el líder acepte/rechace compañeros con un solo clic.

### D. Módulo: Votación en Tiempo Real (Voting)
* **API:** Handlers públicos para obtener propuesta activa (`active`) y emitir voto único (`vote`) con prevención de doble voto transaccional. Handlers de administración para crear propuestas (`admin-create`), listarlas (`admin-list`) y activarlas o cerrarlas (`admin-toggle`) manipulando el documento único `/polls/active`.
* **Frontend:** 
  * [VoterPanel.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/voting/apps/portal/src/app/portal/[token]/votacion/VoterPanel.tsx) se suscribe en tiempo real vía `onSnapshot` de Firestore. Cambia instantáneamente cuando el moderador activa la votación, permitiendo votar de inmediato y bloqueando segundas votaciones de forma proactiva.
  * [AdminPolls.tsx](file:///Users/raulcanul/Documents/Dev/platform-register/templates/modules/voting/apps/admin/src/app/(dashboard)/votaciones/AdminPolls.tsx) ofrece un visor de resultados con barras animadas en tiempo real y un "Modo Proyector" optimizado para pantallas gigantes con visualizaciones limpias.

---

## 3. Pruebas End-to-End (E2E) Realizadas

Se desarrolló un arnés de pruebas automatizado (`test-scaffold.ts`) que comprueba los tres arquetipos clave y la correcta inyección/exclusión de sus piezas:

1. **Caso 1 (Standard con Playera y Talleres):**
   * Confirma la creación del monorepo base.
   * Valida la parametrización de `serverless.yml` y `create.ts`.
   * Verifica que se inyectaron los handlers y componentes de `tshirt` y `workshops`.
   * Asegura que los componentes exclusivos de Plenarias (ej: búsqueda de iglesias) **no** fueron copiados.
2. **Caso 2 (Roles con Hospedaje/Cuartos):**
   * Valida la estructura de `rooms` (hospedaje) e inyección del componente de selección de entrada (`Step2Tier.tsx`).
3. **Caso 3 (Plenarias con Votaciones):**
   * Valida la estructura específica de `plenarias` (carga de cartas, búsqueda de iglesias) y la inyección de `voting` en el panel administrador y de participantes.

Todas las pruebas de scaffolding se completaron con **100% de éxito**.

---

## 4. Ejecución del Generador

Para compilar e iniciar el generador interactivo:

```bash
# 1. Compilar el CLI
npm run build

# 2. Ejecutar la consola interactiva
node dist/index.js
```
