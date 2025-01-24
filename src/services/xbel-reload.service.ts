import { promises as fs } from "fs";
import { getBookmarksData } from "./drive.service";
import { parseXMLToJSON } from "../utils/xmlParser";
import { FaviconService } from "./favicon.service";
import { loadBookmarksFromCache, saveBookmarksToCache } from "./cache.service";

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
    console.time('xbel-reload');
    console.log("Getting bookmarks data from drive service...");
    const xmlData = await getBookmarksData();

    console.log("Parsing XML to JSON...");
    const jsonData = await parseXMLToJSON(xmlData);
    
    // Get existing bookmarks for comparison
    const existingBookmarks = await loadBookmarksFromCache() || [];
    const existingBookmarksMap = createBookmarkMap(existingBookmarks);
    
    // Extract URLs and identify which ones need icon updates
    const { urlsToProcess, unchangedUrls } = await identifyUrls(jsonData, existingBookmarksMap);
    
    console.log(`Found ${urlsToProcess.length} URLs to process and ${unchangedUrls.length} unchanged URLs`);
    
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
      console.log("Downloading icons in parallel...");
      const downloadPromises = urlsToProcess.map(async (url) => {
        try {
          const response = await downloadIcon(url);
          if (response && response.ok) {
            const location = await FaviconService.saveIcon(url, response);
            if (location !== DEFAULT_LOCATION) {
              locationResults.set(url, location);
            }
          }
        } catch (error) {
          console.error(`Error downloading icon for ${url}:`, error);
        }
      });

      // Wait for all downloads to complete
      await Promise.all(downloadPromises);
    }

    // Add locations to bookmarks
    console.log("Updating bookmark data with icon locations...");
    const bookmarksWithLocations = addLocations(jsonData, locationResults, existingBookmarksMap);
    
    // Save to cache
    console.log("Saving updated bookmarks to cache...");
    await saveBookmarksToCache(bookmarksWithLocations);
    
    // Clean up unused icons
    const allUrls = [...urlsToProcess, ...unchangedUrls];
    await FaviconService.cleanup(allUrls);
    
    // Calculate success rate
    const successfulDownloads = Array.from(locationResults.values()).filter(
      location => location !== DEFAULT_LOCATION
    ).length;
    
    console.timeEnd('xbel-reload');
    
    return { 
      message: "XBEL reload completed successfully",
      stats: {
        totalUrls: allUrls.length,
        processed: urlsToProcess.length,
        unchanged: unchangedUrls.length,
        successfulDownloads,
        failedDownloads: urlsToProcess.length - successfulDownloads
      }
    };
  } catch (error) {
    console.error("Error reloading XBEL:", error);
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

async function downloadIcon(url: string): Promise<Response | null> {
  try {
    const domain = new URL(url).origin;
    
    // Intentar favicon.ico primero
    try {
      const response = await fetch(`${domain}/favicon.ico`);
      if (response.ok && response.headers.get('content-length') !== '0') {
        return response;
      }
    } catch {}

    // Si no hay favicon.ico, buscar en el HTML
    try {
      const pageResponse = await fetch(domain);
      if (!pageResponse.ok) return null;

      const html = await pageResponse.text();
      const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
      
      if (iconMatch && iconMatch[1]) {
        const iconUrl = new URL(iconMatch[1], domain).href;
        const iconResponse = await fetch(iconUrl);
        if (iconResponse.ok && iconResponse.headers.get('content-length') !== '0') {
          return iconResponse;
        }
      }
    } catch {}

    return null;
  } catch (error: unknown) {
    console.error(`Failed to download icon for ${url}:`, error);
    return null;
  }
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