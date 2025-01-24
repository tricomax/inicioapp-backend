import { loadBookmarksFromCache, cachedBookmarks, isCacheEmpty } from "../services/cache.service";
import { reloadFromXBEL } from "../services/xbel-reload.service";

export async function getBookmarks() {
  // If cache is not initialized, try to load from cache file
  if (!cachedBookmarks) {
    const cached = await loadBookmarksFromCache();
    if (cached) {
      return cached;
    }
  }

  // If we have cached bookmarks, return them
  if (cachedBookmarks) {
    return cachedBookmarks;
  }

  // If cache is empty, perform initial XBEL load
  const isEmpty = await isCacheEmpty();
  if (isEmpty) {
    console.log("Cache is empty, performing initial XBEL load");
    await reloadFromXBEL();
    return cachedBookmarks;
  }

  throw new Error("Failed to load bookmarks");
}