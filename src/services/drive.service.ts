import { google, type drive_v3 } from "googleapis";
import { logger } from "./logger.service";

const credentials = Bun.file(process.env.GOOGLE_CREDENTIALS_PATH!);

const auth = new google.auth.GoogleAuth({
  credentials: await credentials.json(),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

async function getFileContent(fileId: string): Promise<string> {
  try {
    logger.info(`Obteniendo contenido del archivo con ID: ${fileId}`);
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "text" }
    );
    logger.info("Contenido del archivo obtenido con éxito");
    return response.data as string;
  } catch (error) {
    logger.error("Error al obtener el contenido del archivo", error);
    throw error;
  }
}

export async function findBookmarksFile(): Promise<string> {
  try {
    logger.info("Buscando archivo de marcadores...");
    const response = await drive.files.list({
      q: "name='bookmarks.xbel'",
      fields: "files(id, name)",
    });
    const files = response.data.files;
    if (files && files.length > 0) {
      logger.info(`Archivo de marcadores encontrado con ID: ${files[0].id}`);
      return files[0].id!;
    } else {
      const error = new Error("Archivo de marcadores no encontrado");
      logger.error(error.message);
      throw error;
    }
  } catch (error) {
    logger.error("Error al buscar el archivo de marcadores", error);
    throw error;
  }
}

export async function getBookmarksData(): Promise<string> {
  try {
    logger.info("Obteniendo datos de marcadores...");
    const fileId = await findBookmarksFile();
    const fileContent = await getFileContent(fileId);
    logger.info("Datos de marcadores obtenidos con éxito");
    return fileContent;
  } catch (error) {
    logger.error("Error al obtener datos de marcadores", error);
    throw error;
  }
}