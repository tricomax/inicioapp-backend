import { app } from "./app";
import { Elysia } from "elysia";
import { FaviconService } from "./services/favicon.service";
import { initFavorites } from "./controllers/favorites.controller";
import { logger } from "./services/logger.service";

// Verificar que los archivos de credenciales existen
const firebaseCredentialsPath = process.env.FIREBASE_ADMINSDK_PATH;
const googleCredentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

if (!firebaseCredentialsPath || !Bun.file(firebaseCredentialsPath).exists()) {
  logger.error("El archivo de credenciales de Firebase no existe o no está configurado correctamente en .env");
  process.exit(1);
}

if (!googleCredentialsPath || !Bun.file(googleCredentialsPath).exists()) {
  logger.error("El archivo de credenciales de Google Drive no existe o no está configurado correctamente en .env");
  process.exit(1);
}

const port = 3000;

async function startServer() {
  try {
    logger.info("Iniciando servicios...");
    // Inicializar servicios requeridos
    await FaviconService.init();
    await initFavorites();
    app.listen(port);
    logger.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
  } catch (error) {
    logger.error("Error al iniciar el servidor", error);
    process.exit(1);
  }
}

function getProtocol(app: Elysia): string {
  if ((app.server as any)?.secure) {
    return "https";
  } else {
    return "http";
  }
}

startServer();