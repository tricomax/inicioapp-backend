# InicioApp Backend

Backend para la aplicación InicioApp que gestiona marcadores y sus favicons.

## Características

- Carga y parseo de archivos XBEL de Chrome
- Caché de marcadores en formato JSON
- Gestión de favicons con preservación de formatos
- Sistema de favoritos
- API RESTful con Elysia y Bun

## Endpoints

### GET /bookmarks
Obtiene todos los marcadores desde el caché. Los marcadores incluyen:
- URL
- Título
- Location del favicon
- Estructura jerárquica (carpetas)

### POST /xbel-reload
Recarga los marcadores desde el archivo XBEL de Chrome:
- Parsea el archivo XBEL
- Descarga los favicons faltantes
- Actualiza el caché
- Mantiene los favicons personalizados

### POST /favicons
Actualiza el favicon de un marcador:
- Acepta cualquier formato de imagen (ico, png, jpg, svg, webp)
- Preserva el formato original del archivo
- Actualiza automáticamente las referencias en bookmarks.json
- Mantiene consistencia entre marcadores y favoritos

#### Ejemplo de Implementación Frontend

```javascript
// Función para actualizar el icono de un bookmark
async function updateBookmarkIcon(url, iconFile) {
  const formData = new FormData();
  formData.append('url', url);
  formData.append('favicon', iconFile);

  const response = await fetch('http://localhost:3000/favicons', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  // result.data.location contiene la nueva ruta del icono
  return result;
}

// Ejemplo de uso
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const bookmarkUrl = 'https://chat.qwenlm.ai/';
  
  try {
    const result = await updateBookmarkIcon(bookmarkUrl, file);
    console.log('Nuevo icono guardado en:', result.data.location);
  } catch (error) {
    console.error('Error al actualizar el icono:', error);
  }
});
```

Respuesta exitosa:
```json
{
  "status": "success",
  "data": {
    "message": "Favicon updated successfully",
    "location": "/favicons/37303430363037353835393630383436353033.png"
  }
}
```

El proceso:
1. Frontend envía la URL del bookmark y el archivo de icono
2. Backend genera un hash de la URL
3. Guarda el archivo manteniendo su extensión original
4. Actualiza la referencia en bookmarks.json
5. Actualiza la referencia en favoritos (si existe)
6. Devuelve la nueva location del icono

### Favoritos

#### GET /favorites
Obtiene la lista de favoritos

#### POST /favorites
Agrega un nuevo favorito:
```typescript
{
  url: string,
  title: string,
  location: string  // Ruta al favicon (/favicons/...)
}
```

#### DELETE /favorites/:url
Elimina un favorito

## Estructura de Archivos

### Caché y Almacenamiento

- `bookmarks.json`: Caché principal de marcadores
- `favorites.json`: Lista de favoritos
- `/storage/favicons/`: Directorio de favicons
  - Nombres de archivo basados en hash de URL
  - Mantiene extensión original del archivo
  - Incluye iconos por defecto

### Endpoints y Controladores

- `app.ts`: Definición de endpoints y rutas
- `controllers/`: Lógica de negocio
  - `bookmarks.controller.ts`: Gestión de marcadores
  - `favorites.controller.ts`: Gestión de favoritos
  - `xbel-reload.controller.ts`: Recarga desde XBEL

### Servicios

- `services/`:
  - `favicon.service.ts`: Gestión de iconos
    - Descarga automática
    - Subida manual
    - Preservación de formatos
  - `cache.service.ts`: Gestión del caché
  - `drive.service.ts`: Interacción con archivos XBEL

## Manejo de Iconos

### Formatos Soportados

- ICO (favicon.ico)
- PNG
- JPEG/JPG
- SVG
- WebP

### Funcionalidad

- **Descarga Automática**:
  - Intenta favicon.ico primero
  - Busca en HTML si no encuentra favicon.ico
  - Detecta formato desde content-type

- **Subida Manual**:
  - Preserva el formato original del archivo
  - Genera nombre basado en hash de URL
  - Mantiene extensión original

- **Referencias**:
  - Usa location en lugar de faviconUrl
  - Formato: `/favicons/[hash].[ext]`
  - Consistente en toda la aplicación

### Actualización de Referencias

1. Se guarda el archivo con su formato original
2. Se actualiza location en bookmarks.json
3. Se actualiza location en favoritos (si existe)
4. Se confirma el éxito de la operación

## Desarrollo

### Requisitos

- Bun
- Node.js 18+

### Instalación

```bash
# Instalar dependencias
bun install

# Iniciar en modo desarrollo
bun run dev
```

### Scripts

- `bun run dev`: Inicia servidor de desarrollo
- `bun run build`: Compila el proyecto
- `bun run start`: Inicia en producción