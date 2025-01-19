import { app } from "./app";
import { Elysia } from "elysia";
import { loadBookmarks } from "./services/cache.service";

const port = 3000;

async function startServer() {
  // Cargar los marcadores al iniciar el servidor (antes de escuchar peticiones)
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