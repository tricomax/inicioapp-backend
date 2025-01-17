import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { verifyToken } from "./services/auth.service";
import { getBookmarks } from "./controllers/bookmarks.controller";

// ---------- Esquemas de validación ----------

const VerifyTokenSchema = t.Object({
  token: t.String(),
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

export const app = new Elysia()
  .use(cors()) // Habilita CORS para todos los orígenes
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
  );