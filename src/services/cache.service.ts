import { promises as fs } from "fs";
import { getBookmarksData } from "./drive.service";
import { parseXMLToJSON } from "../utils/xmlParser";
import { FaviconService } from "./favicon.service";

const bookmarksFile = "./bookmarks.json";
export let cachedBookmarks: any = null;

export async function loadBookmarks() {
  try {
    console.log("Getting bookmarks data from drive service...");
    const xmlData = await getBookmarksData();

    console.log("Parsing XML to JSON...");
    const jsonData = await parseXMLToJSON(xmlData);
    
    // Extraer URLs y descargar favicons
    const urls = extractUrls(jsonData);
    console.log(`Downloading favicons for ${urls.length} URLs...`);
    const faviconPromises = urls.map(url => FaviconService.downloadFavicon(url));
    const faviconResults = await Promise.all(faviconPromises);

    // Añadir rutas de favicon a los marcadores
    const bookmarksWithFavicons = addFaviconUrls(jsonData, urls, faviconResults);
    
    // Guardar en caché y archivo
    cachedBookmarks = bookmarksWithFavicons;
    await saveBookmarksToLocalFile(bookmarksWithFavicons);
    
    // Limpiar favicons no utilizados
    await FaviconService.cleanup(urls);
    
    return bookmarksWithFavicons;
  } catch (error) {
    console.error("Error loading bookmarks:", error);
    // Intentar cargar desde el archivo local como respaldo
    return loadBookmarksFromLocalFile();
  }
}

function extractUrls(bookmarks: any[]): string[] {
  const urls: string[] = [];
  const traverse = (items: any[]) => {
    for (const item of items) {
      if (item.type === 'bookmark' && item.url) {
        urls.push(item.url);
      }
      if (item.children) {
        traverse(item.children);
      }
    }
  };
  traverse(bookmarks);
  return urls;
}

function addFaviconUrls(bookmarks: any[], urls: string[], faviconFiles: string[]): any[] {
  const urlToFavicon = new Map(
    urls.map((url, index) => [url, faviconFiles[index]])
  );

  const addFavicon = (items: any[]): any[] => {
    return items.map(item => {
      if (item.type === 'bookmark' && item.url) {
        return {
          ...item,
          faviconUrl: `/favicons/${urlToFavicon.get(item.url)}`
        };
      }
      if (item.type === 'folder') {
        return {
          ...item,
          faviconUrl: `/favicons/folder-icon.png`,
          children: item.children ? addFavicon(item.children) : []
        };
      }
      return item;
    });
  };
  return addFavicon(bookmarks);
}

async function saveBookmarksToLocalFile(bookmarks: any) {
  try {
    await fs.writeFile(bookmarksFile, JSON.stringify(bookmarks, null, 2));
    console.log("Bookmarks saved to local file successfully.");
  } catch (error) {
    console.error("Error saving bookmarks to local file:", error);
    throw error;
  }
}

async function loadBookmarksFromLocalFile() {
  try {
    const data = await fs.readFile(bookmarksFile, "utf-8");
    const bookmarks = JSON.parse(data);
    console.log("Bookmarks loaded from local file successfully.");
    return bookmarks;
  } catch (error) {
    console.error("Error loading bookmarks from local file:", error);
    return null;
  }
}

async function createBookmarksFileIfNotExists() {
  try {
    await fs.access(bookmarksFile);
    console.log("Bookmarks file exists.");
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log("Bookmarks file does not exist. Creating...");
      await saveBookmarksToLocalFile([]);
      console.log("Bookmarks file created.");
    } else {
      console.error("Error accessing bookmarks file:", error);
      throw error;
    }
  }
}

// Asegúrate de que el archivo exista al iniciar
createBookmarksFileIfNotExists();