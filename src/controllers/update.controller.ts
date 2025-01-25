import { loadBookmarksFromCache } from "../services/cache.service";
import { logger } from "../services/logger.service";

export async function updateCache(): Promise<{ message: string }> {
  try {
    await loadBookmarksFromCache();
    return { message: "Cache updated successfully" };
  } catch (error) {
    logger.error("Error updating cache", error);
    throw error;
  }
}