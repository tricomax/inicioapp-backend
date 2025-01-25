import { promises as fs } from "fs";
import { logger } from "./logger.service";

const BOOKMARKS_FILE = "./bookmarks.json";
export let cachedBookmarks: any = null;

export async function initializeCache() {
  try {
    await fs.access(BOOKMARKS_FILE);
    logger.info("Archivo de caché de marcadores existe");
    return loadBookmarksFromCache();
  } catch (error: any) {
    if (error.code === "ENOENT") {
      logger.info("El archivo de caché de marcadores no existe");
      return null;
    }
    throw error;
  }
}

export async function saveBookmarksToCache(bookmarks: any) {
  try {
    await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
    cachedBookmarks = bookmarks;
    logger.info("Marcadores guardados en caché exitosamente");
  } catch (error) {
    logger.error("Error al guardar marcadores en caché", error);
    throw error;
  }
}

export async function loadBookmarksFromCache() {
  try {
    const data = await fs.readFile(BOOKMARKS_FILE, "utf-8");
    cachedBookmarks = JSON.parse(data);
    logger.info("Marcadores cargados desde caché exitosamente");
    return cachedBookmarks;
  } catch (error) {
    logger.error("Error al cargar marcadores desde caché", error);
    return null;
  }
}

export async function isCacheEmpty() {
  try {
    await fs.access(BOOKMARKS_FILE);
    const data = await fs.readFile(BOOKMARKS_FILE, "utf-8");
    const bookmarks = JSON.parse(data);
    return !bookmarks || bookmarks.length === 0;
  } catch {
    return true;
  }
}

// Initialize cache on service start
initializeCache();