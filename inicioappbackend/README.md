# InicioApp Backend

Backend para la aplicación InicioApp que gestiona marcadores y sus favicons.

## Características

- Carga y parseo de archivos XBEL de Chrome
- Caché de marcadores en formato JSON
- Sistema simple y rápido de favicons
- Sistema de favoritos
- API RESTful con Elysia y Bun
- Sistema de logs personalizado

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
- Intenta descargar favicons faltantes
- Mantiene favicons existentes y personalizados
- Proporciona estadísticas básicas

Ejemplo de respuesta:
```json
{
  "status": "success",
  "data": {
    "message": "XBEL reload completed successfully",
    "stats": {
      "totalUrls": 150,
      "processed": 50,
      "unchanged": 100,
      "iconsAttempted": 50,
      "iconsFound": 30
    }
  }
}
```

### POST /favicons
Actualiza el favicon de un marcador manualmente.

#### Petición
```javascript
// Usando FormData
const formData = new FormData();
formData.append('url', 'https://chat.qwenlm.ai/');
formData.append('favicon', iconFile); // File object
```

#### Respuesta Exitosa
```json
{
  "status": "success",
  "data": {
    "message": "Favicon updated successfully",
    "location": "/favicons/37303430363037353835393630383436353033.png"
  }
}
```

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

### Carpeta Build (inicioappbackend/)

La carpeta `inicioappbackend/` es el directorio de destino para la versión compilada del proyecto, equivalente a una carpeta dist pero manteniendo la estructura específica del proyecto:

- `src/`: Código JavaScript compilado con la misma estructura que el proyecto original
  - `assets/`: Recursos estáticos
  - `controllers/`, `services/`, etc.: Módulos compilados
- `storage/`: Carpeta para favicons
- `logs/`: Archivos de log organizados por fecha

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
    - Descarga automática de favicon.ico
    - Subida manual
    - Preservación de formatos
  - `cache.service.ts`: Gestión del caché
  - `drive.service.ts`: Interacción con archivos XBEL
  - `logger.service.ts`: Sistema de logs

## Sistema de Logs

La aplicación incluye un sistema de logs organizado y fácil de mantener:

### Características

- Logs diarios (formato: YYYY-MM-DD.log)
- Archivos separados para errores (YYYY-MM-DD-error.log)
- Timestamps en formato ISO
- Niveles de log (INFO, WARN, ERROR)
- Salida simultánea a consola y archivo

### Almacenamiento

Los logs se guardan en:
- `/logs/`: Directorio principal de logs
  - `YYYY-MM-DD.log`: Logs generales del día
  - `YYYY-MM-DD-error.log`: Errores del día

## Sistema de Favicons

### Método de Descarga Automática

- Intento simple de `/favicon.ico`
- Sin búsqueda en HTML para mayor velocidad
- Los favicons no encontrados se pueden agregar manualmente

### Formatos Soportados

- ICO (favicon.ico)
- PNG
- JPEG/JPG
- SVG
- WebP

### Estadísticas Simples

El sistema mantiene estadísticas básicas:
- Total de URLs procesadas
- Iconos intentados descargar
- Iconos encontrados
- Tasa de éxito

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
- `bun build build.ts`: Crea build personalizada en inicioappbackend/
- `cd inicioappbackend && bun src/server.js`: Inicia versión compilada