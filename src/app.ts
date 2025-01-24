import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from '@elysiajs/static';
import { verifyToken } from "./services/auth.service";
import { getBookmarks } from "./controllers/bookmarks.controller";
import { getFavorites, addFavorite, removeFavorite, updateFavoriteLocation } from "./controllers/favorites.controller";
import { getObsoleteBookmarks } from "./controllers/obsoleteBookmarks.controller";
import { handleXBELReload } from "./controllers/xbel-reload.controller";
import { FaviconService } from "./services/favicon.service";
import { loadBookmarksFromCache, saveBookmarksToCache } from "./services/cache.service";

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

// ---------- Funciones auxiliares para el manejo de errores ----------

const handleSuccess = (data: any, status: number = 200) => ({
  status: "success",
  data,
});

const handleError = (message: string, status: number = 500) => ({
  status: "error",
  message,
});

// ---------- Funciones auxiliares ----------

async function updateBookmarkLocation(bookmarks: any[], url: string, location: string): Promise<boolean> {
  let updated = false;
  for (const item of bookmarks) {
    if (item.type === 'bookmark' && item.url === url) {
      console.log(`[Bookmark] Actualizando location para ${url}:
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
  .get("/", () => handleSuccess({ message: "Welcome to InicioApp Backend!" }))
  .group("/auth", (app) =>
    app.post(
      "/verify",
      async ({ body, set }) => {
        try {
          const user = await verifyToken(body.token);
          console.log("Token verified successfully:", user);
          return handleSuccess({ user });
        } catch (error) {
          console.error("Error verifying token:", error);
          set.status = 401;
          return handleError("Invalid token", 401);
        }
      },
      { body: VerifyTokenSchema }
    )
  )
  .group("/bookmarks", (app) =>
    app.get("/", async ({ set }) => {
      try {
        const bookmarks = await getBookmarks();
        return handleSuccess({ bookmarks });
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
        set.status = 500;
        return handleError("Failed to fetch bookmarks", 500);
      }
    })
  )
  .group("/favorites", (app) =>
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
    console.log(`[Favicon] Iniciando actualización de icono para URL: ${body.url}`);

    try {
      if (!body.favicon || !body.url) {
        console.error("[Favicon] Error: faltan campos requeridos");
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
      console.log(`[Favicon] Icono guardado en: ${location}`);

      // 3. Actualizar location en bookmarks
      const updated = await updateBookmarkLocation(bookmarks, body.url, location);
      if (!updated) {
        throw new Error(`No se encontró el bookmark para la URL: ${body.url}`);
      }

      // 4. Guardar cambios en bookmarks.json
      await saveBookmarksToCache(bookmarks);
      console.log(`[Favicon] Location actualizada en bookmarks`);

      // 5. Actualizar location en favoritos si existe
      await updateFavoriteLocation(body.url, location);
      console.log(`[Favicon] Location actualizada en favoritos`);
      
      return handleSuccess({ 
        message: "Favicon updated successfully",
        location 
      });

    } catch (error: any) {
      console.error("[Favicon] Error:", error);
      set.status = 500;
      return handleError(error?.message || "Failed to update favicon");
    }
  }, { body: FaviconUploadSchema })
  .get("/obsolete-bookmarks", async () => {
    const obsoleteBookmarks = await getObsoleteBookmarks();
    return handleSuccess({ obsoleteBookmarks });
  })
  .post("/xbel-reload", async ({ set }) => {
    try {
      const result = await handleXBELReload();
      return handleSuccess({
        message: result.message,
        stats: result.stats
      });
    } catch (error) {
      console.error("Error reloading XBEL:", error);
      set.status = 500;
      return handleError("Failed to reload XBEL");
    }
  });