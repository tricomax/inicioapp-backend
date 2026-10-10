import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from '@elysiajs/static';
import { verifyToken } from "./services/auth.service";
import { getBookmarks } from "./controllers/bookmarks.controller";
import { getFavorites, addFavorite, removeFavorite, updateFavoriteLocation } from "./controllers/favorites.controller";
import { getObsoleteBookmarks } from "./controllers/obsoleteBookmarks.controller";
import { handleXBELReload } from "./controllers/xbel-reload.controller";
import { handleXbelUpload, MAX_XBEL_SIZE } from "./controllers/xbel-upload.controller";
import { FaviconService } from "./services/favicon.service";
import { loadBookmarksFromCache, saveBookmarksToCache } from "./services/cache.service";
import { logger } from "./services/logger.service";

// ---------- Tipos ----------

type RequestWithTimer = Request & {
  startTime?: number;
};

// ---------- Esquemas de validación ----------

const VerifyTokenSchema = t.Object({
  token: t.String(),
});

const FavoriteSchema = t.Object({
  url: t.String(),
  title: t.String(),
  location: t.String(),
});

const FaviconUploadSchema = t.Object({
  url: t.String(),
  favicon: t.File()
});

const XbelUploadSchema = t.Object({
  file: t.File()
});

// ---------- Funciones auxiliares para el manejo de errores ----------

const handleSuccess = (data: any, status: number = 200) => ({
  status: "success",
  data,
});

const handleError = (message: string, status: number = 500) => ({
  status: "error",
  message,
});

// ---------- Middleware ----------

const authMiddleware = async ({ request, set }: { request: Request, set: any }) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    set.status = 401;
    return handleError('Token no proporcionado', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    set.status = 401;
    return handleError('Token no proporcionado', 401);
  }

  try {
    await verifyToken(token);
  } catch (error) {
    set.status = 401;
    return handleError('Token inválido', 401);
  }
};

// ---------- Funciones auxiliares ----------

async function updateBookmarkLocation(bookmarks: any[], url: string, location: string): Promise<boolean> {
  let updated = false;
  for (const item of bookmarks) {
    if (item.type === 'bookmark' && item.url === url) {
      logger.info(`Actualizando location para ${url}:
        Anterior: ${item.location}
        Nueva: ${location}`);
      item.location = location;
      updated = true;
    }
    if (item.children) {
      const childUpdated = await updateBookmarkLocation(item.children, url, location);
      updated = updated || childUpdated;
    }
  }
  return updated;
}

// ---------- Aplicación Elysia ----------

export const app = new Elysia({
  serve: {
    idleTimeout: 0
  }
})
  .use(cors())
  .use(staticPlugin({
    prefix: '/favicons',
    assets: './storage/favicons'
  }))
  // Middleware para logging de peticiones
  .onBeforeHandle(({ request }) => {
    (request as RequestWithTimer).startTime = Date.now();
  })
  .onAfterHandle(({ request, path, request: { method }, set: { status } }) => {
    const startTime = (request as RequestWithTimer).startTime || Date.now();
    const duration = Date.now() - startTime;
    logger.http(method as string, path as string, status as number, duration);
  })
  .onError(({ error, path, request: { method } }) => {
    logger.error(`Error en ${method} ${path}`, error);
  })
  .get("/", () => handleSuccess({ message: "Welcome to InicioApp Backend!" }))
  .group("/auth", app => 
    app.post(
      "/verify",
      async ({ body, set }) => {
        try {
          const user = await verifyToken(body.token);
          logger.info("Token verificado exitosamente: " + JSON.stringify(user));
          return handleSuccess({ user });
        } catch (error) {
          logger.error("Error verificando token", error);
          set.status = 401;
          return handleError("Invalid token", 401);
        }
      },
      { body: VerifyTokenSchema }
    )
  )
  .group("/bookmarks", app => 
    app.get("/", async ({ set }) => {
      try {
        const bookmarks = await getBookmarks();
        return handleSuccess({ bookmarks });
      } catch (error) {
        logger.error("Error obteniendo bookmarks", error);
        set.status = 500;
        return handleError("Failed to fetch bookmarks", 500);
      }
    })
  )
  .group("/favorites", app => 
    app
      .get("/", async () => {
        const favorites = await getFavorites();
        return handleSuccess({ favorites });
      })
      .post("/", async ({ body }) => {
        await addFavorite(body);
        return handleSuccess({ message: "Favorite added" });
      }, { body: FavoriteSchema })
      .delete("/:url", async ({ params }) => {
        await removeFavorite(decodeURIComponent(params.url));
        return handleSuccess({ message: "Favorite removed" });
      })
  )
  .post("/favicons", async ({ body, set }) => {
    logger.info(`Iniciando actualización de icono para URL: ${body.url}`);

    try {
      if (!body.favicon || !body.url) {
        logger.warn("Error: faltan campos requeridos");
        set.status = 400;
        return handleError("Missing favicon or URL", 400);
      }

      // 1. Cargar bookmarks actuales
      const bookmarks = await loadBookmarksFromCache();
      if (!bookmarks) {
        throw new Error("No se pudo cargar bookmarks.json");
      }

      // 2. Guardar el nuevo icono
      const location = await FaviconService.saveCustomIcon(body.url, body.favicon);
      logger.info(`Icono guardado en: ${location}`);

      // 3. Actualizar location en bookmarks
      const updated = await updateBookmarkLocation(bookmarks, body.url, location);
      if (!updated) {
        throw new Error(`No se encontró el bookmark para la URL: ${body.url}`);
      }

      // 4. Guardar cambios en bookmarks.json
      await saveBookmarksToCache(bookmarks);
      logger.info(`Location actualizada en bookmarks`);

      // 5. Actualizar location en favoritos si existe
      await updateFavoriteLocation(body.url, location);
      logger.info(`Location actualizada en favoritos`);
      
      return handleSuccess({ 
        message: "Favicon updated successfully",
        location 
      });

    } catch (error: any) {
      logger.error("Error actualizando favicon", error);
      set.status = 500;
      return handleError(error?.message || "Failed to update favicon");
    }
  }, { body: FaviconUploadSchema })
  .get("/obsolete-bookmarks", async () => {
    const obsoleteBookmarks = await getObsoleteBookmarks();
    return handleSuccess({ obsoleteBookmarks });
  })
  // Solo la ruta de recarga XBEL requiere autenticación
  .post("/xbel-reload", async ({ request, set }) => {
    // Verificar autenticación
    const authResult = await authMiddleware({ request, set });
    if (authResult) return authResult;

    try {
      const result = await handleXBELReload();
      return handleSuccess({
        message: result.message,
        stats: result.stats
      });
    } catch (error) {
      logger.error("Error recargando XBEL", error);
      set.status = 500;
      return handleError("Failed to reload XBEL");
    }
  })
  // Subida manual de un archivo XBEL (sustituye la recarga desde Google Drive)
  .post("/xbel-upload", async ({ body, request, set }) => {
    // Verificar autenticación
    const authResult = await authMiddleware({ request, set });
    if (authResult) return authResult;

    try {
      const file = body.file;

      if (!file || file.size === 0) {
        set.status = 400;
        return handleError("No se recibió ningún archivo XBEL", 400);
      }

      if (file.size > MAX_XBEL_SIZE) {
        set.status = 413;
        return handleError(
          `El archivo supera el tamaño máximo permitido (${Math.round(MAX_XBEL_SIZE / 1024 / 1024)} MB)`,
          413
        );
      }

      const content = await file.text();
      const result = await handleXbelUpload({ content, fileName: file.name });

      logger.info(`XBEL subido correctamente desde "${file.name}"`);

      return handleSuccess({
        message: result.message,
        fileName: file.name,
        stats: result.stats
      });
    } catch (error: any) {
      logger.error("Error procesando el XBEL subido", error);
      set.status = 400;
      return handleError(error?.message || "No se pudo procesar el archivo XBEL", 400);
    }
  }, { body: XbelUploadSchema });
