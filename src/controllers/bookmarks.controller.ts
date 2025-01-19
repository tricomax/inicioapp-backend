import {
  loadBookmarks,
  cachedBookmarks,
} from "../services/cache.service";

export async function getBookmarks() {
  // Si los marcadores no están en la caché, los carga (desde el archivo local o Google Drive)
  if (!cachedBookmarks) {
    await loadBookmarks();
  }
  // Devuelve los marcadores desde la caché
  return cachedBookmarks;
}