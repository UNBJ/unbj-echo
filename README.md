# unbj-echo

CLI para generar plataformas de registro y acreditación para eventos. A partir
de un arquetipo y módulos seleccionables crea un monorepo listo para configurar
con portal de asistentes, panel administrativo, API Serverless y Firebase.

> La documentación de operación de cada plataforma generada está en la
> [plantilla de README](templates/base/README.md.ejs). Este documento explica el
> desarrollo y uso del **generador**.

## Qué genera

```text
proyecto-generado/
├── apps/
│   ├── portal/              Portal público de registro y asistentes (Next.js)
│   └── admin/               Panel administrativo (Next.js)
├── packages/
│   ├── api/                 API AWS Lambda / API Gateway (Serverless)
│   └── shared/              Tipos, etiquetas y branding compartidos
├── firestore.rules          Reglas Firebase versionadas
├── firestore.indexes.json   Índices Firestore
├── storage.rules            Reglas de Firebase Storage
├── storage.cors.json        CORS de cargas mediante URL firmada
└── README.md                Guía de setup y despliegue del proyecto generado
```

Cada proyecto generado incluye además `AGENTS.md`, instrucciones por workspace,
referencias bajo demanda en `docs/agent/` y los comandos `context:refresh` /
`context:check` para que Codex y otros agentes comiencen con contexto preciso
sin cargar toda la documentación humana.

El resultado incluye las siguientes piezas:

- Registro, pago mediante Stripe, correos por Resend, portal de seguimiento y
  check-in con QR.
- Un panel administrativo con roles Firebase `admin` y `super_admin`.
- Arquetipos: registro estándar, entradas/roles y delegados por iglesia.
- Módulos de playeras, talleres, hospedaje y votación en tiempo real.
- Reglas de acceso, límites de frecuencia, cargas de documentos con URLs
  firmadas y configuración de CORS para Storage.

## Requisitos

- Node.js 20 o superior.
- pnpm 9 o superior (el proyecto usa pnpm 10.33 en el preview).
- Git.

Para ejecutar o desplegar un proyecto generado también se requieren Firebase,
AWS, Stripe, Resend y Google Cloud SDK. Consulta la guía generada para esos
pasos.

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

## Uso local del CLI

Compila el CLI y ejecútalo de forma interactiva:

```bash
npm run build
node dist/index.js -n "Congreso Anual 2026"
```

El asistente pregunta arquetipo, módulos e idiomas. El nombre técnico se deriva
del evento y, si no se indica una salida, se crea una subcarpeta con ese slug en
el directorio actual.

Para usar el binario `unbj-echo` durante el desarrollo local:

```bash
npm run install:local
unbj-echo -n "Congreso Anual 2026"
```

Para deshacer el enlace global al terminar:

```bash
npm unlink -g unbj-echo
```

## Uso no interactivo

Esto permite automatizar la generación en scripts o CI:

```bash
unbj-echo \
  --event-name "Congreso Anual 2026" \
  --output ./mi-evento \
  --archetype plenarias \
  --modules "tshirt,workshops,rooms,voting" \
  --languages es-en \
  --yes
```

| Opción | Valores | Descripción |
| --- | --- | --- |
| `-n, --event-name <name>` | texto | Nombre visible del evento; `-n` es el alias corto recomendado |
| `-e, --event <event>` | texto | Alias compatible de `--event-name` |
| `-o, --output <path>` | ruta | Carpeta de salida; si se omite se crea `<slug-del-evento>` en el directorio actual |
| `-a, --archetype <archetype>` | `standard`, `roles`, `plenarias` | Flujo de registro inicial |
| `-m, --modules <modules>` | `tshirt`, `workshops`, `rooms`, `voting` | Lista separada por comas; `--modules ""` no selecciona ninguno |
| `-l, --languages <languages>` | `es`, `es-en` | Idioma único o soporte español/inglés |
| `-y, --yes` | — | Omite la confirmación interactiva |

Ejemplos:

```bash
# Evento sencillo sin módulos, sólo español.
unbj-echo --event-name "Festival 2026" --output ./festival -a standard -m "" -l es -y

# Entradas por categoría, con talleres y hospedaje.
unbj-echo -n "Congreso 2026" -o ./congreso -a roles -m "workshops,rooms" -l es-en -y
```

## Arquetipos y módulos

| Elemento | Propósito |
| --- | --- |
| `standard` | Registro base, pago, QR y portal personal. |
| `roles` | Entradas/categorías como general, estudiante o VIP. |
| `plenarias` | Iglesia, convención, tipos de delegado, carta y validación de cupos. |
| `tshirt` | Selección y administración de tallas de playera. |
| `workshops` | Catálogo, cupos e inscripción a talleres. |
| `rooms` | Habitaciones, responsables, invitaciones y acompañantes. |
| `voting` | Votos por propuesta y resultados en tiempo real. |

Los módulos se copian al proyecto generado y se controlan mediante feature flags
en runtime. Esto permite activarlos o desactivarlos desde la configuración sin
tener que volver a generar todo el proyecto.

## Arquitectura del generador

```text
src/index.ts
    │ Commander + preguntas Clack + validación de argumentos
    ▼
src/utils/generator.ts
    ├── Copia templates/base
    ├── Superpone templates/archetypes/<arquetipo>
    ├── Inyecta templates/modules/*
    ├── Fusiona dependencias y rutas Serverless de módulos
    ├── Configura i18n
    └── Renderiza archivos .ejs con las opciones elegidas
             │
             ▼
       monorepo generado
```

### Directorios importantes

| Ruta | Responsabilidad |
| --- | --- |
| `src/index.ts` | Interfaz de línea de comandos, prompts y validación de flags. |
| `src/utils/generator.ts` | Copia, inyección de módulos y renderizado EJS. |
| `templates/base/` | Código y configuración comunes a todos los proyectos. |
| `templates/archetypes/` | Diferencias por flujo de negocio. |
| `templates/modules/` | Capacidades opcionales inyectadas en portal, admin y API. |
| `scripts/preview-project.mjs` | Generación y mantenimiento del proyecto de preview local. |
| `scripts/test-generator.mjs` | Matriz de escenarios para validar generación y tipos. |

## Desarrollo del generador

Instala dependencias y usa el modo de reconstrucción automática:

```bash
pnpm install
npm run dev
```

En otra terminal, prueba una generación con los argumentos que necesitas:

```bash
node dist/index.js --event-name "Prueba" --output /private/tmp/mi-prueba -a plenarias -m "voting" -l es-en -y
```

No uses un directorio de proyecto real como destino de pruebas: el generador
sobrescribe archivos existentes.

### Agregar o modificar una plantilla

1. Decide si el cambio pertenece a la base, a un arquetipo o a un módulo.
2. Mantén la misma ruta que debe tener el archivo final dentro de `templates/`.
3. Usa extensión `.ejs` sólo cuando necesites valores como `<%= eventName %>` o
   condicionales de arquetipo/idioma.
4. Si un módulo requiere dependencias o endpoints, actualiza su
   `inject-config.json`.
5. Genera al menos un proyecto que incluya el cambio.
6. Ejecuta `pnpm run typecheck` desde ese proyecto generado.

El orden es importante: la base se copia primero, el arquetipo seleccionado la
sobrescribe y los módulos se inyectan después. Evita que dos módulos escriban
el mismo archivo sin una estrategia explícita de combinación.

### Agregar un módulo

Un módulo vive en `templates/modules/<nombre>/` y puede aportar archivos para
`apps/portal`, `apps/admin`, `packages/api` y `packages/shared`. Para declarar
dependencias y rutas HTTP añade un `inject-config.json`:

```json
{
  "dependencies": {
    "apps/portal": { "mi-paquete": "^1.0.0" }
  },
  "serverless": {
    "functions": {
      "miHandler": {
        "handler": "src/handlers/mi-modulo/handler.handler",
        "events": [{ "httpApi": { "path": "/mi-modulo", "method": "post" } }]
      }
    }
  }
}
```

Después registra su nombre en `availableModules` de
`src/utils/generator.ts` y en las opciones/validación de `src/index.ts`.

## Preview local

El repositorio puede generar una plataforma de ejemplo en `preview-project/`
con el arquetipo `plenarias`, todos los módulos e i18n español/inglés.

```bash
npm run preview:generate  # genera el preview y archivos .env placeholder
npm run preview:install   # instala sus dependencias
npm run preview:typecheck # valida TypeScript
```

Para regenerarlo e instalar dependencias en un paso:

```bash
npm run preview:refresh
```

Detén antes los procesos de preview: el script se niega a borrar el directorio
si encuentra los puertos 3100, 3102 o 3001 activos.

| Comando | Servicio |
| --- | --- |
| `npm run preview:dev:portal` | Portal en `http://localhost:3100` |
| `npm run preview:dev:admin` | Admin en `http://localhost:3102` |
| `npm run preview:dev:api` | API local en `http://localhost:3001` |
| `npm run preview:grant-admin -- correo@ejemplo.com` | Asigna rol admin en el preview configurado |

El preview utiliza credenciales placeholder después de generarse. Configura sus
archivos `.env` con un proyecto Firebase/Stripe de pruebas antes de validar
pagos, autenticación, Storage o votaciones reales.

## Validación antes de integrar cambios

```bash
npm run build
node scripts/test-generator.mjs
```

El segundo comando genera combinaciones de arquetipo/idioma/módulo e instala
dependencias para ejecutar `pnpm run typecheck`. Es más lento, pero detecta
colisiones de plantillas y errores TypeScript del proyecto final.

Como mínimo, para un cambio acotado genera el escenario afectado y valida:

```bash
npm run build
node dist/index.js --output /private/tmp/validacion --event-name "Validación" -a standard -m "" -l es -y
cd /private/tmp/validacion
pnpm install
pnpm typecheck
```

## Publicar una nueva versión del CLI

El paquete aún se ejecuta desde el repositorio. Si se publica en npm, el flujo
recomendado es:

1. Actualizar versión y changelog.
2. Ejecutar la matriz de generación y typecheck.
3. Revisar que ningún `.env`, credencial, PDF o dato de preview vaya incluido en
   el paquete.
4. Ejecutar `npm publish` desde un estado limpio y etiquetar el commit.

Mientras no se publique, usa `npm link` o `node dist/index.js` como se describe
arriba.

## Seguridad de las plantillas

- No introduzcas secretos en `templates/`, ejemplos, snapshots ni documentación.
- Mantén las reglas Firestore/Storage cerradas por defecto; las cargas de cartas
  deben seguir usando URLs firmadas y CORS de origen explícito.
- Revisa las actualizaciones de Next.js, Firebase, Serverless, Stripe y sus
  dependencias antes de cada lanzamiento.
- Genera y prueba con proyectos cloud separados de producción.

## Licencia

ISC. Consulta `package.json` para la información vigente del paquete.
