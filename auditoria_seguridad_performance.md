# Auditoría de Seguridad y Performance

**Fecha:** 06 de agosto de 2026  
**Alcance:** generador, plantillas y preview local; flujos base y módulos de playeras, talleres, hospedaje y votaciones.  
**Fuera de alcance:** cuentas y configuraciones desplegadas de AWS, Firebase, Stripe y Resend; no se usaron datos ni credenciales reales.

> **Estado de remediación (06 de agosto de 2026):** se implementaron en las plantillas las correcciones de aplicación descritas abajo: actualización de Next/React, reglas deny-by-default, carga de cartas con URL firmada canónica, DTO de portal, expiración de enlaces nuevos, límites de frecuencia, CORS explícito, escapes HTML/CSV, paginación por cursor, caché breve de flags/estadísticas, índices Firestore, cabeceras, y listeners Firestore para votaciones. Antes de desplegar siguen siendo obligatorios los puntos de infraestructura de S-10/P-05 (WAF, IAM, secretos, alarmas, TTL y prueba de carga) y desplegar las reglas/índices con Firebase.

## Resumen ejecutivo

La plataforma tiene buenas bases: validación con Zod en la mayoría de mutaciones, verificación de firma en webhooks de Stripe, roles administrativos en Firebase y transacciones Firestore para operaciones de cupos y votos. Sin embargo, **no está lista para producción** sin corregir los hallazgos críticos: la versión de Next.js tiene una vulnerabilidad RCE conocida y el flujo de cartas permite escritura no autenticada y firma de rutas arbitrarias de Storage.

Para el objetivo de 1,000–2,000 asistentes, el polling de votaciones y las consultas administrativas que cargan colecciones completas exceden el presupuesto de lecturas y latencia esperado.

| Severidad | Seguridad | Performance |
| --- | ---: | ---: |
| Crítica | 3 | 0 |
| Alta | 3 | 2 |
| Media | 3 | 3 |
| Baja / validación de despliegue | 1 | 1 |

## Hallazgos de seguridad

### Crítica — S-01: Next.js 15.1.0 vulnerable a ejecución remota de código

**Evidencia:** `apps/admin` y `apps/portal` fijan `next@15.1.0`; el lockfile generado advierte explícitamente de `CVE-2025-66478`.

**Impacto:** la versión usa App Router y está dentro del rango afectado por la vulnerabilidad crítica de React Server Components (CVSS 10.0), que puede permitir RCE al procesar peticiones controladas por un atacante.

**Corrección:** actualizar Next.js a una versión parcheada como mínimo `15.1.9`; preferir la versión estable de mantenimiento vigente y actualizar React/React DOM de forma compatible. Si alguna instancia estuvo expuesta sin parche, rotar secretos tras desplegar la actualización, tal como recomienda la [alerta oficial de Next.js](https://nextjs.org/blog/CVE-2025-66478).

### Crítica — S-02: Storage permite cargas no autenticadas de documentos

**Evidencia:** `templates/base/storage.rules` permite `write` en `cartas/{token}/{fileName}` por tamaño y MIME, pero no exige `request.auth` ni vincula la ruta con un usuario autenticado.

**Impacto:** cualquier actor puede escribir hasta 10 MB en rutas adivinables o arbitrarias bajo `cartas/`, causando abuso de almacenamiento, sustitución de archivos y distribución de contenido no confiable. El comentario de la regla afirma que el usuario está autenticado, pero la condición real no lo verifica.

**Corrección:** deshabilitar escrituras directas del cliente y usar exclusivamente URLs firmadas de duración corta emitidas por el backend después de validar el token de portal y el estado del registro. Alternativamente, exigir Firebase Auth real y reglas que validen el `uid`; no usar el token de portal como identidad de Storage.

### Crítica — S-03: El envío de carta acepta y firma cualquier ruta de Storage

**Evidencia:** `carta-submit.ts` acepta `filePath` del cliente sin comprobar que pertenezca al registro. Después llama a `getSignedReadUrl(filePath)`, que firma la ruta recibida con la cuenta de servicio. El cliente actual no usa el endpoint de URL firmada y sube directamente a `cartas/{token}/...`.

**Impacto:** quien posea un token válido puede solicitar una URL firmada de lectura para cualquier objeto accesible a la cuenta de servicio, por ejemplo documentos de otros registros. También puede asociar una ruta ajena a su propio registro.

**Corrección:** no aceptar `filePath` del cliente. Generar en el backend una ruta canónica, por ejemplo `cartas/{registrationId}/carta.{ext}`, guardar esa ruta al emitir la URL de subida y, al confirmar, comparar contra la ruta guardada. Validar extensión/MIME en servidor, limitar una carga por registro y reducir las URLs de lectura a minutos; el administrador debe solicitar una URL temporal al abrir el archivo, no almacenar una URL válida por siete días.

### Alta — S-04: Tokens de portal son capacidades permanentes expuestas en URL y devuelven PII amplia

**Evidencia:** `GET /registrations/{token}` usa el token en la ruta, no expira ni se puede revocar, y devuelve todo el registro salvo `qrToken`, incluidos teléfono, fecha de nacimiento, estado, referencias de pago y URLs firmadas si existen.

**Impacto:** un enlace filtrado por historial, capturas, logs, referer o reenvío da acceso persistente a datos personales. La ausencia de un DTO de lectura permite que nuevos campos sensibles se expongan accidentalmente.

**Corrección:** definir una respuesta pública por lista blanca; introducir expiración/revocación o intercambio del token por una sesión HttpOnly de duración limitada; añadir `Cache-Control: no-store`, `Referrer-Policy: no-referrer` y no usar el secreto como parte de URLs salientes cuando sea evitable.

### Alta — S-05: No hay rate limiting ni controles de abuso en API

**Evidencia:** Serverless HTTP API no declara throttling/WAF ni los handlers usan límites. Aplica a registro, creación de PaymentIntents, búsquedas, votos, carga de documentos y reenvío de acceso.

**Impacto:** automatización de registros, coste de Stripe/Resend/Firestore, spam de correos, fuerza bruta contra tokens y degradación del evento.

**Corrección:** WAF/API Gateway con límites por IP y reglas de bot; límites por token/registro para mutaciones; CAPTCHA o desafío equivalente en registro; idempotency keys para pagos; límite de reenvíos y auditoría/alertas de anomalías.

### Alta — S-06: Reenvío administrativo de acceso no tiene límite de frecuencia

**Evidencia:** `admin/resend-access.ts` registra intentos, pero cada solicitud autorizada envía un correo y no aplica cooldown ni cuota.

**Impacto:** un administrador comprometido o un error operativo puede generar spam y coste de Resend.

**Corrección:** imponer cooldown por registro (por ejemplo, 5–15 minutos), cuota diaria por administrador y alerta al superar umbrales. Conservar la auditoría ya implementada.

### Media — S-07: Inyección HTML en correos y fórmulas en CSV

**Evidencia:** los templates de correo interpolan `fullName`, iglesia y convención sin escape HTML. `admin/export.ts.ejs` escapa comas/comillas, pero no neutraliza valores que empiezan con `=`, `+`, `-` o `@`.

**Impacto:** usuarios maliciosos pueden inyectar HTML en correos administrativos/confirmaciones o fórmulas al abrir exportaciones en Excel/Sheets.

**Corrección:** función central `escapeHtml` para todo dato de usuario en HTML; al exportar CSV, anteponer `'` a valores con prefijos de fórmula antes de aplicar el escape CSV.

### Media — S-08: CORS global permite cualquier origen

**Evidencia:** `serverless.yml.ejs` usa `allowedOrigins: ['*']`; la exportación también responde `Access-Control-Allow-Origin: '*'`.

**Impacto:** amplía la superficie de abuso desde sitios terceros y no aplica una política de navegador acorde a una aplicación con PII y tokens de capacidad.

**Corrección:** generar una lista explícita de dominios del portal/admin y sus previews. Mantener el webhook fuera de CORS y revisar encabezados de seguridad a nivel CDN/API Gateway.

### Media — S-09: Reglas de Firestore no están versionadas

**Evidencia:** existe `storage.rules`, pero `firebase.json` no referencia reglas Firestore ni hay un `firestore.rules` en las plantillas.

**Impacto:** no se puede verificar que el acceso directo del cliente al documento `config/features` sea mínimo ni que producción deniegue lecturas/escrituras no deseadas.

**Corrección:** versionar y desplegar reglas Firestore con `firebase.json`; por defecto denegar todo y permitir solo las lecturas mínimas indispensables. Verificar reglas con Emulator Suite en CI.

### Baja / despliegue — S-10: Secretos, logging y cabeceras requieren validación externa

El código consume secretos por variables de entorno, pero el alcance no permite comprobar KMS/Secrets Manager, rotación, IAM de Lambda, logs con retención, WAF, TLS, CloudTrail o alertas. Deben ser criterios de salida antes de producción.

## Hallazgos de performance y coste

### Alta — P-01: Polling de votaciones no escala a 1,000–2,000 asistentes

**Evidencia:** `VoterPanel.tsx` consulta `/polls/active` y `/polls/closed` cada tres segundos. Cada handler vuelve a buscar el registro por token y las flags; `closed.ts` recupera todas las votaciones cerradas en cada llamada.

**Impacto estimado:** con 2,000 asistentes son ~1,333 solicitudes/segundo solo desde el navegador. Cada ciclo genera varias lecturas Firestore y el historial cerrado crece sin límite, superando ampliamente coste y latencia aceptables para votaciones en vivo.

**Corrección:** no recargar historial cerrado en polling; cargarlo una vez con paginación/cursor y refrescarlo tras un cierre. Para la encuesta activa, usar una suscripción Firestore con reglas correctas o un canal/cache controlado; si se conserva polling, hacerlo adaptativo (10–30 s, pausa en pestaña oculta, backoff y ETag/cache). Cachear flags y resolver el token una sola vez por sesión/capacidad firmada.

### Alta — P-02: Listado de registros simula paginación después de leer toda la colección

**Evidencia:** `admin/list-registrations.ts.ejs` ejecuta `query.get()`, filtra búsqueda en memoria y después aplica `slice` para páginas de 20.

**Impacto:** cada página administrativa lee y transfiere todos los registros. A 2,000 asistentes, búsquedas y navegación elevan coste Firestore, memoria de Lambda y latencia; empeora linealmente con el evento.

**Corrección:** paginación cursor-based (`startAfter` + `limit`), índices compuestos para filtros, campos normalizados para búsqueda prefijada y una solución de búsqueda externa/algolia solo si se requiere texto libre. Separar `count` de la carga de filas o mostrar “más resultados” sin contar toda la colección.

### Media — P-03: Consultas completas en estadísticas y exportación

**Evidencia:** `admin/stats.ts.ejs` y `admin/export.ts.ejs` leen todos los registros; estadísticas vuelve a calcular agregados para cada visita.

**Impacto:** para 2,000 asistentes es tolerable como tarea ocasional, pero no para refresco frecuente ni crecimiento futuro. La exportación puede agotar memoria si no se acota.

**Corrección:** mantener contadores agregados transaccionales/materializados para dashboard; exportar como trabajo asíncrono paginado con archivo temporal y URL firmada.

### Media — P-04: Autorización y feature flags disparan lecturas repetidas

**Evidencia:** `verifyRegistrantToken` consulta Firestore en cada petición; `getFeatureFlags` lee Firestore en cada handler. El formulario de pago además hace polling cada dos segundos hasta 30 segundos.

**Impacto:** multiplica lecturas en todos los módulos y vuelve el coste proporcional a cada interacción, en especial en accesos masivos y confirmación de pagos.

**Corrección:** emitir una capacidad firmada/de corta vida al resolver el enlace, cachear flags en memoria de Lambda con TTL breve, y sustituir el polling de pago por evento/estado con backoff exponencial y máximo de intentos.

### Media — P-05: Falta configuración explícita de capacidad y observabilidad de Lambda

**Evidencia:** `serverless.yml.ejs` no define timeout, memoria, reserved/provisioned concurrency, alarmas, tracing o métricas de negocio.

**Impacto:** el comportamiento bajo picos depende de valores por defecto y los incidentes no tienen presupuestos ni señales de detección.

**Corrección:** perfilar handlers y fijar memoria/timeout por función; reservar concurrencia para webhooks/pagos y aplicar límites al resto; instrumentar p95/p99, errores, throttles, lecturas Firestore, tasa de pagos y tiempo de check-in.

### Baja — P-06: Dependencias Serverless incompatibles en peer dependencies

El lockfile indica `serverless-offline@13` y `serverless-plugin-typescript@2` con peers para Serverless 2/3 mientras el proyecto usa Serverless 4. No es evidencia de fallo en producción, pero aumenta el riesgo de comportamiento no soportado en desarrollo/build.

**Corrección:** retirar el plugin TypeScript si es redundante con `serverless-esbuild` o actualizar las herramientas a combinaciones compatibles y fijadas.

## Roadmap de remediación

### P0 — Bloqueante antes de cualquier despliegue público

1. Actualizar Next.js/React a versiones parcheadas y rotar secretos si hubo exposición.
2. Deshabilitar cargas directas a Storage; corregir reglas y hacer canónica la ruta de carta en backend.
3. Validar `filePath` contra el registro, reducir URLs firmadas y retirar URLs persistidas de respuestas públicas.
4. Introducir rate limiting/WAF para registro, tokens, pagos, cargas, votos y reenvío de correo.
5. Versionar reglas Firestore y verificar una postura default-deny con emuladores.

### P1 — Antes del evento de 1,000–2,000 asistentes

1. Reemplazar polling de votaciones y pago; paginar historial de resultados.
2. Implementar cursor pagination e índices en registros; agregar contadores para estadísticas.
3. Crear DTOs públicos por lista blanca, expiración/revocación de acceso y headers `no-store`/referrer.
4. Restringir CORS a orígenes conocidos y añadir cabeceras de seguridad en CDN/API.
5. Escapar HTML y neutralizar fórmulas CSV.

### P2 — Endurecimiento operativo

1. Configurar memoria, timeout, concurrencia, alarmas y tracing de Lambda.
2. Automatizar auditoría de dependencias y actualizaciones de seguridad en CI.
3. Ejecutar prueba de carga en un Firebase/Stripe de prueba con datos sintéticos y medir los SLO acordados.
4. Revisar IAM mínimo privilegio, Secret Manager/KMS, rotación, retención de logs y respuesta a incidentes en producción.

## Evidencia y límites de validación

* Se revisaron los handlers, rutas Serverless, reglas de Storage, plantillas de portal/admin, módulos y lockfiles generados.
* El typecheck y la generación ya existían como controles; esta auditoría no alteró lógica de producción ni usó datos reales.
* La consulta automática a advisories del gestor de paquetes no devolvió un resultado utilizable desde el sandbox. El lockfile, no obstante, identifica la vulnerabilidad de Next.js confirmada por la alerta oficial enlazada arriba.
* No se ejecutó prueba de carga real: requiere un Firebase/Stripe de prueba y métricas de infraestructura, que están fuera del alcance elegido.
