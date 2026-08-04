# Guía de Configuración Paso a Paso: Cloudflare R2

Sigue esta guía detallada para conectar la galería de fotos de tu sitio web a tu bucket real de **Cloudflare R2** y comenzar a sincronizar fotos reales.

---

## 1. Crear el Bucket en Cloudflare R2
1. Inicia sesión en el [Panel de Cloudflare](https://dash.cloudflare.com/).
2. En el menú lateral izquierdo, haz clic en **R2** (debajo de *Object Storage*).
3. Haz clic en **Create bucket**.
4. Escribe un nombre para tu bucket, por ejemplo: `unbj-photos`.
5. Haz clic en **Create bucket** para finalizar.

---

## 2. Configurar el Acceso Público (Public URL)
Para que los usuarios puedan ver y descargar las fotos, el bucket debe ser accesible públicamente:
1. Dentro de tu bucket recién creado, ve a la pestaña **Settings** (Configuración).
2. Desplázate hacia abajo hasta la sección **Public Sharing** (Compartir públicamente).
3. Tienes dos opciones:
   * **Domain (.r2.dev)**: Haz clic en **Allow Access** para activar una URL temporal y gratuita provista por Cloudflare.
   * **Custom Domain**: Haz clic en **Connect Domain** para conectar un subdominio de tu sitio web (por ejemplo, `fotos.unbj.cnbm.mx`).
4. Copia la URL pública generada (por ejemplo, `https://pub-xxxxxx.r2.dev/`). *Asegúrate de que termine con una barra inclinada (`/`).*

---

## 3. Configurar las Reglas CORS
El navegador de tus usuarios necesita permisos para descargar las imágenes directamente del bucket. Debes configurar una regla CORS:
1. En la pestaña **Settings** de tu bucket, baja hasta la sección **CORS Policy** y haz clic en **Add CORS Policy**.
2. Pega el siguiente código JSON:
   ```json
   [
     {
       "AllowedOrigins": [
         "http://localhost:4321",
         "https://unbj.cnbm.mx",
         "https://www.unbj.cnbm.mx"
       ],
       "AllowedMethods": [
         "GET",
         "HEAD"
       ],
       "AllowedHeaders": [
         "*"
       ],
       "ExposeHeaders": []
     }
   ]
   ```
3. Haz clic en **Save**.

---

## 4. Obtener las Credenciales de API (R2 API Tokens)
Necesitas credenciales para que tu script local lea la lista de fotos del bucket:
1. Regresa a la página de inicio de **R2** en Cloudflare.
2. A la derecha, haz clic en **Manage R2 API Tokens**.
3. Haz clic en **Create API Token**.
4. Nombra tu token, por ejemplo: `unbj-gallery-sync`.
5. En **Permissions**, selecciona **Object Read & Write** (Lectura y Escritura de Objetos).
6. En **Bucket Scopes**, selecciona **Apply to specific buckets** y elige tu bucket (`unbj-photos`).
7. Haz clic en **Create API Token**.
8. **IMPORTANTE**: Copia y guarda los valores generados inmediatamente, ya que no se volverán a mostrar:
   * **Access Key ID**
   * **Secret Access Key**
   * **Endpoint** (formato: `https://<tu_account_id>.r2.cloudflarestorage.com`)

---

## 5. Configurar el Entorno en el Proyecto Local
1. Crea un archivo llamado **`.env`** en la raíz de tu proyecto.
2. Rellena los campos con las credenciales que obtuviste en el paso anterior:
   ```env
   R2_ACCESS_KEY_ID=pega_aqui_tu_access_key_id
   R2_SECRET_ACCESS_KEY=pega_aqui_tu_secret_access_key
   R2_ENDPOINT=https://pega_aqui_tu_account_id.r2.cloudflarestorage.com
   R2_BUCKET_NAME=unbj-photos
   R2_PUBLIC_URL=https://pega_aqui_tu_public_url.r2.dev/
   ```

---

## 6. Subir Fotos y Estructurar el Bucket
El script de sincronización busca carpetas llamadas `/lunes`, `/martes`, `/miercoles` y `/jueves`.
1. Dentro de tu bucket en Cloudflare, crea carpetas llamadas:
   * `lunes/`
   * `martes/`
   * `miercoles/`
   * `jueves/`
2. Sube tus fotos de alta resolución en la carpeta del día correspondiente.

---

## 7. Ejecutar la Sincronización y Compilar el Sitio
Una vez que tengas fotos en el bucket y las credenciales en tu archivo `.env`:
1. Ejecuta el script de sincronización localmente:
   ```bash
   npm run build
   ```
2. El script detectará las credenciales reales en tu `.env`, se conectará a R2, obtendrá las dimensiones y nombres de las fotos reales, generará `src/data/photos.json` automáticamente y compilará todo el sitio web en la carpeta `dist/`.
3. Sube el nuevo archivo `dist.zip` compilado a tu Hostinger Shared Hosting. ¡Y listo! Tu galería estará 100% activa.
