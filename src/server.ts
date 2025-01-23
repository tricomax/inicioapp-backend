import { app } from "./app";
import { Elysia } from "elysia";
import { loadBookmarks } from "./services/cache.service";
import { FaviconService } from "./services/favicon.service";
import { initFavorites } from "./controllers/favorites.controller";

const port = 3000;

async function startServer() {
  // Inicializar servicios requeridos
  await FaviconService.init();
  await initFavorites();
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