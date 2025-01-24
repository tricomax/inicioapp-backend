import { reloadFromXBEL } from "../services/xbel-reload.service";

export async function handleXBELReload() {
  try {
    const result = await reloadFromXBEL();
    console.log("XBEL Reload Statistics:", {
      totalBookmarks: result.stats.totalUrls,
      processedBookmarks: result.stats.processed,
      successfulDownloads: result.stats.successfulDownloads,
      failedDownloads: result.stats.failedDownloads,
      skippedBookmarks: result.stats.unchanged
    });
    return result;
  } catch (error) {
    console.error("Error handling XBEL reload:", error);
    throw error;
  }
}