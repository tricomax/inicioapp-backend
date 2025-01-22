# InicioApp Backend

Servicio backend desarrollado con Bun/Elysia para la gestión de marcadores y favoritos con soporte para favicon.

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
- Obtiene todos los marcadores
- La respuesta incluye datos del marcador con URLs de favicon
- Los marcadores se almacenan en caché local y se sincronizan con Google Drive

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

### Archivos Estáticos

```
GET /favicons/*
```
- Sirve archivos de favicon
- Iconos predeterminados para marcadores y carpetas
- Descarga y almacena automáticamente favicons de sitios web

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
  - Descarga y almacenamiento automático de favicons
  - Iconos predeterminados como respaldo
  - Limpieza automática de favicons no utilizados

- **Sincronización de Marcadores**:
  - Integración con Google Drive para almacenamiento
  - Caché local para mejor rendimiento
  - Sincronización automática

- **Manejo de Errores**:
  - Respaldo para favicons faltantes
  - Caché local como respaldo para operación sin conexión
  - Respuestas de error adecuadas con códigos de estado

## Desarrollo

El servidor se ejecuta en el puerto 3000 por defecto. Todas las respuestas siguen un formato estándar:

```typescript
{
  status: "success" | "error";
  data?: any;
  message?: string;
}
```

## Integración Frontend

Para integrar con el frontend:

1. Asegurar que CORS está configurado correctamente (habilitado por defecto para todos los orígenes)
2. Utilizar los endpoints de la API con la autenticación apropiada
3. Manejar URLs de favicon usando el prefijo `/favicons/`
4. Implementar manejo de errores adecuado para las respuestas de la API

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
- 401: No autorizado (token inválido)
- 500: Error del servidor

## Almacenamiento de Archivos

- Favicons se almacenan en `./storage/favicons/`
- Marcadores se almacenan en caché en `bookmarks.json`
- Favoritos se almacenan en `favorites.json`

## Gestión de Caché

- Los marcadores se almacenan en caché local para mejor rendimiento
- Los favicons se descargan y almacenan con nombres basados en hash
- Los favicons no utilizados se limpian automáticamente