import { app } from "./app";
import { Elysia } from "elysia";
import { loadBookmarks } from "./services/cache.service";
import { FaviconService } from "./services/favicon.service";
import { initFavorites } from "./controllers/favorites.controller";

const port = 3000;

async function startServer() {
  // Cargar los marcadores al iniciar el servidor (antes de escuchar peticiones)
  await FaviconService.init();
  await initFavorites(); // Inicializar favoritos antes de cargar marcadores
  await loadBookmarks();
  app.listen(port);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
}

function getProtocol(app: Elysia): string {
  if ((app.server as any)?.secure) {
    return "https";
  } else {
    return "http";
  }
}

startServer();