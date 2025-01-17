# InicioApp Backend

Este es el backend de la aplicación InicioApp, desarrollado con **Bun** y **ElysiaJS**. Proporciona una API para la gestión de marcadores y la autenticación de usuarios.

## Características

*   **Autenticación con Firebase:** Los usuarios se autentican a través de Firebase Authentication, utilizando Google como proveedor.
*   **Obtención de marcadores:** La API permite obtener la estructura de carpetas y marcadores del usuario desde un archivo `bookmarks.xbel` almacenado en Google Drive.
*   **Transformación de XML a JSON:** El archivo `bookmarks.xbel` (en formato XML) se transforma a un formato JSON más manejable para el frontend.
*   **Copia local de marcadores:** El backend guarda una copia local de los marcadores en formato JSON (`bookmarks.json`) para mejorar el rendimiento y servir como respaldo en caso de fallos al acceder a Google Drive.
*   **Manejo de errores:** El backend maneja los errores y devuelve respuestas con códigos de estado HTTP apropiados.
*   **Soporte CORS:**  Configurado para permitir peticiones desde cualquier origen (configurable para mayor seguridad en producción).

## Requisitos

*   [Bun](https://bun.sh/) (v1.0.0 o superior)
*   Cuenta de Google
*   Proyecto en Firebase con la autenticación de Google habilitada.
*   Cuenta de servicio en Google Cloud Platform con acceso de lectura a Google Drive.
*   Archivo `bookmarks.xbel` en Google Drive compartido con la cuenta de servicio.

## Configuración

1. **Clonar el repositorio:**

    ```bash
    git clone <URL del repositorio>
    cd inicioapp-backend
    ```

2. **Instalar dependencias:**

    ```bash
    bun install
    ```

3. **Configurar variables de entorno:**

    *   Crea un archivo `.env` en la raíz del proyecto.
    *   Añade las siguientes variables de entorno:

        ```
        FIREBASE_ADMINSDK_PATH=./ruta/al/archivo/firebase-adminsdk.json
        GOOGLE_CREDENTIALS_PATH=./ruta/al/archivo/google-credentials.json
        ```

        *   `FIREBASE_ADMINSDK_PATH`: Ruta al archivo JSON de la clave privada de Firebase Admin SDK. Puedes descargarlo desde la consola de Firebase en la configuración del proyecto -> Cuentas de servicio.
        *   `GOOGLE_CREDENTIALS_PATH`: Ruta al archivo JSON de la clave privada de la cuenta de servicio de Google Cloud. Puedes descargarlo desde la consola de Google Cloud en IAM y administración -> Cuentas de servicio.

4. **Configurar `bookmarks.json`:**

    *   Crea un archivo vacío llamado `bookmarks.json` en la raíz del proyecto. Este archivo se usará para almacenar una copia local de los marcadores.

5. **Compartir el archivo `bookmarks.xbel`:**
    *   Sube tu archivo `bookmarks.xbel` a Google Drive.
    *   Comparte el archivo con la dirección de correo electrónico de la cuenta de servicio (la que aparece en el archivo `google-credentials.json` en el campo `client_email`). Dale permisos de **Lector**.

## Ejecutar el backend

```bash
bun run dev
Use code with caution.
Esto iniciará el servidor de desarrollo de Elysia en http://localhost:3000.

Rutas
GET /: Devuelve un mensaje de bienvenida.

POST /auth/verify: Verifica el token de autenticación de Firebase enviado por el frontend.

Request:

{
  "token": "TOKEN_DE_FIREBASE"
}
Use code with caution.
Json
Response (éxito):

{
  "status": "success",
  "user": {
    // Datos del usuario de Firebase
  }
}
Use code with caution.
Json
Response (error):

{
  "status": "error",
  "message": "Invalid token"
}
Use code with caution.
Json
GET /bookmarks: Devuelve la estructura de carpetas y marcadores en formato JSON.

Tecnologías
Bun: Runtime de JavaScript rápido y moderno.

ElysiaJS: Framework web para Bun, rápido y fácil de usar.

Firebase Admin SDK: Para la autenticación de usuarios.

Google Cloud Client Libraries for Node.js: Para interactuar con Google Drive.

xml2js: Para parsear el archivo XML de marcadores.

Notas
Este backend está configurado para permitir peticiones desde cualquier origen (CORS). En un entorno de producción, se recomienda restringir los orígenes permitidos.

La funcionalidad para gestionar favoritos aún no está implementada.

Contribuciones
Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request.