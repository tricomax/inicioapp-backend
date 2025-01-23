# InicioApp Backend

Servicio backend desarrollado con Bun/Elysia vinculado al frontend https://github.com/tricomax/inicioApp-frontend

## Stack Tecnológico

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Elysia](https://elysiajs.com/)
- **Autenticación**: Firebase Admin
- **APIs Externas**: Google Drive API
- **Almacenamiento**: Sistema de archivos local para favicons y caché

## Estructura del Proyecto

```
inicioapp-backend/
├── src/
│   ├── assets/                 # Recursos estáticos (iconos predeterminados)
│   ├── controllers/            # Controladores de rutas
│   ├── services/              # Lógica de negocio y servicios externos
│   ├── types/                 # Definiciones de tipos TypeScript
│   ├── utils/                 # Funciones utilitarias
│   ├── app.ts                 # Configuración de la aplicación y rutas
│   └── server.ts              # Punto de entrada del servidor
├── storage/
│   └── favicons/             # Favicons descargados y en caché
└── package.json
```

## Instalación y Configuración

1. Instalar dependencias:
```bash
bun install
```

2. Configurar credenciales de Firebase Admin y API de Google Drive.

3. Ejecutar servidor de desarrollo:
```bash
bun dev
```

4. Para construcción de producción:
```bash
bun build
```

## Endpoints de la API

### Autenticación

```
POST /auth/verify
```
- Verifica un token de autenticación de Firebase
- Cuerpo: `{ token: string }`
- Respuesta: `{ status: "success", data: { user: UserData } }` o mensaje de error

### Marcadores

```
GET /bookmarks
```
- Obtiene todos los marcadores desde la caché local
- La respuesta incluye datos del marcador con URLs de favicon
- Los marcadores se almacenan en caché local y se sincronizan con Google Drive
- Para recargar desde XBEL, usar primero el endpoint `/xbel-reload`

### Favoritos

```
GET /favorites
```
- Obtiene todos los marcadores favoritos
- Respuesta: `{ status: "success", data: { favorites: Favorite[] } }`

```
POST /favorites
```
- Añade un nuevo favorito
- Cuerpo: `{ url: string, title: string, faviconUrl: string }`
- Respuesta: Mensaje de éxito o error

```
DELETE /favorites/:url
```
- Elimina un favorito por URL
- La URL debe estar codificada en URI
- Respuesta: Mensaje de éxito o error

### Favicons

```
POST /favicons
```
- Guarda o actualiza un favicon personalizado para una URL específica
- Cuerpo: `multipart/form-data` con:
  - `url`: URL del marcador
  - `favicon`: Archivo de imagen
- Actualiza automáticamente la URL del favicon en favoritos si existe
- Respuesta: `{ status: "success", message: "Favicon saved successfully" }` o mensaje de error
- Ejemplo de uso en frontend:
```javascript
async function saveCustomFavicon(url, iconFile) {
  const formData = new FormData();
  formData.append('url', url);
  formData.append('favicon', iconFile);

  const response = await fetch('/favicons', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    // Recargar marcadores para obtener el nuevo favicon
    await loadBookmarks();
  } else {
    console.error('Error al guardar el favicon');
  }
}

// Ejemplo de uso con un input file
const input = document.querySelector('input[type="file"]');
input.onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    saveCustomFavicon('https://example.com', file);
  }
};
```

### Marcadores Obsoletos

```
GET /obsolete-bookmarks
```
- Obtiene la lista de marcadores que presentan el error "Unable to connect"
- Estos marcadores pueden requerir revisión manual en el navegador web
- Respuesta: `{ status: "success", data: { obsoleteBookmarks: string[] } }`

### Recarga de XBEL

```
POST /xbel-reload
```
- Recarga y actualiza la caché de marcadores desde el archivo XBEL
- Procesa el archivo y actualiza la caché local
- Respuesta: `{ status: "success", data: { message: "XBEL reloaded successfully" } }` o mensaje de error
- Esta operación puede tardar varios minutos dependiendo del número de marcadores
- La conexión se mantiene abierta durante todo el proceso (no hay timeout)
- Uso recomendado cuando hay cambios en los marcadores del navegador
- Después de la recarga, usar GET /bookmarks para obtener los datos actualizados

### Archivos Estáticos

```
GET /favicons/*
```
- Sirve archivos de favicon
- Iconos predeterminados para marcadores y carpetas
- Favicons descargados automáticamente
- Favicons personalizados

## Estructuras de Datos

### Tipo Favorito
```typescript
interface Favorite {
  url: string;
  title: string;
  faviconUrl: string;
}
```

### Estructura de Marcador
```typescript
interface Bookmark {
  type: 'bookmark' | 'folder';
  title: string;
  url?: string;
  faviconUrl: string;
  children?: Bookmark[];
}
```

## Características

- **Gestión de Favicons**:
  - Descarga automática de favicons para URLs sin icono personalizado
  - Soporte para favicons personalizados con prioridad sobre la descarga automática
  - Actualización automática de favoritos al modificar favicons
  - Almacenamiento basado en hash de URL para consistencia
  - Actualización automática al reemplazar favicons existentes
  - Iconos predeterminados como respaldo
  - Gestión eficiente del almacenamiento

- **Sincronización de Marcadores**:
  - Integración con Google Drive para almacenamiento
  - Caché local para mejor rendimiento
  - Actualización manual vía endpoint /xbel-reload
  - Sincronización automática

- **Manejo de Errores**:
   - Respaldo para favicons faltantes
   - Caché local como respaldo para operación sin conexión
   - Respuestas de error adecuadas con códigos de estado
   - Identificación y seguimiento de marcadores inaccesibles
   - Lista de marcadores con error "Unable to connect" para revisión manual

## Desarrollo

El servidor se ejecuta en el puerto 3000 por defecto. Todas las respuestas siguen un formato estándar:

```typescript
{
  status: "success" | "error";
  data?: any;
  message?: string;
}
```

## Manejo de Errores

Todos los endpoints devuelven errores en el formato:
```typescript
{
  status: "error";
  message: string;
}
```

Códigos HTTP comunes:
- 200: Éxito
- 400: Error de solicitud (ej: falta archivo en la subida)
- 401: No autorizado (token inválido)
- 500: Error del servidor

## Almacenamiento de Archivos

- Los favicons se almacenan en `./storage/favicons/[hash].ico`
- El registro de favicons personalizados se mantiene en `./storage/favicons/custom_icons.json`
- Marcadores se almacenan en caché en `bookmarks.json`
- Favoritos se almacenan en `favorites.json`

## Flujo de Sincronización

1. **Carga Inicial**:
   - GET /bookmarks carga datos desde la caché local

2. **Actualización Manual**:
   - POST /xbel-reload procesa el archivo XBEL y actualiza la caché
   - GET /bookmarks obtiene los datos actualizados

3. **Gestión de Favicons**:
   - POST /favicons sube un favicon personalizado
   - El sistema actualiza automáticamente referencias en favoritos
   - GET /bookmarks refleja los cambios en los favicons

## Gestión de Caché

- Los marcadores se almacenan en caché local para mejor rendimiento
- Los favicons se almacenan con nombres basados en hash de URL
- Los favicons personalizados tienen prioridad
- La limpieza automática respeta los favicons personalizados
- Uso de /xbel-reload para actualización manual de la caché