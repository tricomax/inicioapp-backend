import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from '@elysiajs/static';
import { verifyToken } from "./services/auth.service";
import { getBookmarks } from "./controllers/bookmarks.controller";
import { getFavorites, addFavorite, removeFavorite, updateFaviconUrl } from "./controllers/favorites.controller";
import { getObsoleteBookmarks } from "./controllers/obsoleteBookmarks.controller";
import { updateCache } from "./controllers/update.controller";
import { FaviconService } from "./services/favicon.service";

// ---------- Esquemas de validación ----------

const VerifyTokenSchema = t.Object({
  token: t.String(),
});

const FavoriteSchema = t.Object({
  url: t.String(),
  title: t.String(),
  faviconUrl: t.String(),
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

// ---------- Aplicación Elysia ----------

export const app = new Elysia({
  serve: {
    idleTimeout: 0 // Deshabilita el timeout de conexiones inactivas
  }
})
  .use(cors()) // Habilita CORS para todos los orígenes
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
        console.log("Bookmarks fetched successfully.");
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
    try {
      if (!body.favicon || !body.url) {
        set.status = 400;
        return handleError("Missing favicon or URL", 400);
      }

      const fileName = await FaviconService.saveCustomFavicon(body.url, body.favicon);
      
      // Actualizar favicon en favoritos si existe
      await updateFaviconUrl(body.url, `/favicons/${fileName}`);
      
      return handleSuccess({ message: "Favicon saved successfully" });
    } catch (error) {
      console.error("Error saving favicon:", error);
      set.status = 500;
      return handleError("Failed to save favicon");
    }
  }, { body: FaviconUploadSchema })
  .get("/obsolete-bookmarks", async () => {
    const obsoleteBookmarks = await getObsoleteBookmarks();
    return handleSuccess({ obsoleteBookmarks });
  })
  .post("/xbel-reload", async () => {
    try {
      const result = await updateCache();
      return handleSuccess(result);
    } catch (error) {
      console.error("Error reloading XBEL:", error);
      return handleError("Failed to reload XBEL");
    }
  });