import { promises as fs } from "fs";

const BOOKMARKS_FILE = "./bookmarks.json";
export let cachedBookmarks: any = null;

export async function initializeCache() {
  try {
    await fs.access(BOOKMARKS_FILE);
    console.log("Bookmarks cache file exists");
    return loadBookmarksFromCache();
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log("Bookmarks cache file does not exist");
      return null;
    }
    throw error;
  }
}

export async function saveBookmarksToCache(bookmarks: any) {
  try {
    await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
    cachedBookmarks = bookmarks;
    console.log("Bookmarks saved to cache successfully");
  } catch (error) {
    console.error("Error saving bookmarks to cache:", error);
    throw error;
  }
}

export async function loadBookmarksFromCache() {
  try {
    const data = await fs.readFile(BOOKMARKS_FILE, "utf-8");
    cachedBookmarks = JSON.parse(data);
    console.log("Bookmarks loaded from cache successfully");
    return cachedBookmarks;
  } catch (error) {
    console.error("Error loading bookmarks from cache:", error);
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