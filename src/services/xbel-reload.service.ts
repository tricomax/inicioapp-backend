import { promises as fs } from "fs";
import { getBookmarksData } from "./drive.service";
import { parseXMLToJSON } from "../utils/xmlParser";
import { FaviconService } from "./favicon.service";
import { loadBookmarksFromCache, saveBookmarksToCache } from "./cache.service";
import { logger } from "./logger.service";

const BATCH_SIZE = 50;
const DEFAULT_LOCATION = '/favicons/default-icon.png';

interface BookmarkMap {
  [url: string]: {
    title: string;
    location?: string;
    lastUpdated?: number;
  };
}

export async function reloadFromXBEL() {
  try {
    logger.time('xbel-reload');
    logger.info("Obteniendo datos de marcadores...");
    const xmlData = await getBookmarksData();

    logger.info("Parseando XML a JSON...");
    const jsonData = await parseXMLToJSON(xmlData);
    
    // Get existing bookmarks for comparison
    const existingBookmarks = await loadBookmarksFromCache() || [];
    const existingBookmarksMap = createBookmarkMap(existingBookmarks);
    
    // Extract URLs and identify which ones need icon updates
    const { urlsToProcess, unchangedUrls } = await identifyUrls(jsonData, existingBookmarksMap);
    
    logger.info(`Marcadores a procesar: ${urlsToProcess.length}, sin cambios: ${unchangedUrls.length}`);
    
    // Process icons
    const locationResults = new Map<string, string>();
    
    // Add unchanged URLs to results first
    for (const url of unchangedUrls) {
      if (existingBookmarksMap[url]?.location) {
        locationResults.set(url, existingBookmarksMap[url].location!);
      }
    }
    
    // Process URLs in parallel
    if (urlsToProcess.length > 0) {
      // Reset favicon stats
      FaviconService.resetStats();

      const chunks: string[][] = [];
      for (let i = 0; i < urlsToProcess.length; i += BATCH_SIZE) {
        chunks.push(urlsToProcess.slice(i, i + BATCH_SIZE));
      }

      for (const [index, chunk] of chunks.entries()) {
        logger.info(`Procesando lote ${index + 1}/${chunks.length} (${chunk.length} URLs)`);
        const downloadPromises = chunk.map(async (url) => {
          try {
            const response = await FaviconService.downloadFavicon(url);
            if (response) {
              const location = await FaviconService.saveIcon(url, response);
              if (location !== DEFAULT_LOCATION) {
                locationResults.set(url, location);
              }
            }
          } catch (error) {
            logger.error(`Error descargando favicon para ${url}`, error);
          }
        });

        await Promise.all(downloadPromises);
      }
    }

    // Add locations to bookmarks
    const bookmarksWithLocations = addLocations(jsonData, locationResults, existingBookmarksMap);
    
    // Save to cache
    await saveBookmarksToCache(bookmarksWithLocations);
    
    // Clean up unused icons
    const allUrls = [...urlsToProcess, ...unchangedUrls];
    await FaviconService.cleanup(allUrls);
    
    // Get final statistics
    const stats = FaviconService.getStats();
    logger.timeEnd('xbel-reload');
    
    logger.info("\n=== Resumen de Favicons ===");
    logger.info(`Total intentados: ${stats.attempted}`);
    logger.info(`Total encontrados: ${stats.succeeded}`);
    logger.info(`└─ Por favicon.ico: ${stats.icoSucceeded}`);
    logger.info(`└─ Por tag HTML: ${stats.htmlSucceeded}`);
    logger.info(`Tasa de éxito: ${(stats.succeeded / stats.attempted * 100).toFixed(2)}%`);
    logger.info("========================\n");
    
    return {
      message: "XBEL reload completed successfully",
      stats: {
        totalUrls: allUrls.length,
        processed: urlsToProcess.length,
        unchanged: unchangedUrls.length,
        iconStats: {
          attempted: stats.attempted,
          succeeded: stats.succeeded,
          icoSucceeded: stats.icoSucceeded,
          htmlSucceeded: stats.htmlSucceeded
        }
      }
    };
  } catch (error) {
    logger.error("Error reloading XBEL", error);
    throw error;
  }
}

function createBookmarkMap(bookmarks: any[]): BookmarkMap {
  const map: BookmarkMap = {};
  const traverse = (items: any[]) => {
    for (const item of items) {
      if (item.type === 'bookmark' && item.url) {
        map[item.url] = {
          title: item.title,
          location: item.location
        };
      }
      if (item.children) {
        traverse(item.children);
      }
    }
  };
  traverse(bookmarks);
  return map;
}

async function identifyUrls(newBookmarks: any[], existingMap: BookmarkMap): Promise<{ urlsToProcess: string[], unchangedUrls: string[] }> {
  const urlsToProcess: string[] = [];
  const unchangedUrls: string[] = [];
  
  const traverse = (items: any[]) => {
    for (const item of items) {
      if (item.type === 'bookmark' && item.url) {
        const existing = existingMap[item.url];
        
        // Process URL if:
        // 1. It doesn't exist in cache
        // 2. The title has changed
        // 3. It has no location
        // 4. It has the default location
        if (!existing || 
            existing.title !== item.title || 
            !existing.location || 
            existing.location === DEFAULT_LOCATION) {
          urlsToProcess.push(item.url);
        } else {
          unchangedUrls.push(item.url);
        }
      }
      if (item.children) {
        traverse(item.children);
      }
    }
  };
  
  traverse(newBookmarks);
  return { urlsToProcess, unchangedUrls };
}

function addLocations(
  bookmarks: any[], 
  locationResults: Map<string, string>,
  existingMap: BookmarkMap
): any[] {
  const addLocation = (items: any[]): any[] => {
    return items.map(item => {
      if (item.type === 'bookmark' && item.url) {
        const newLocation = locationResults.get(item.url);
        const existing = existingMap[item.url];
        const existingLocation = existing?.location;
        
        // Use new location if available, otherwise keep existing non-default location,
        // fall back to default
        const location = newLocation || 
          (existingLocation !== DEFAULT_LOCATION ? existingLocation : DEFAULT_LOCATION);
        
        return {
          ...item,
          location
        };
      }
      if (item.type === 'folder') {
        return {
          ...item,
          location: '/favicons/folder-icon.png',
          children: item.children ? addLocation(item.children) : []
        };
      }
      return item;
    });
  };
  return addLocation(bookmarks);
}