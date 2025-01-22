import { loadBookmarks, cachedBookmarks } from "../services/cache.service";

export async function getBookmarks() {
  if (!cachedBookmarks) {
    return await loadBookmarks();
  }
  return cachedBookmarks;
}