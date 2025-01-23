import { loadBookmarks } from "../services/cache.service";

export async function updateCache(): Promise<{ message: string }> {
  try {
    await loadBookmarks();
    return { message: "Cache updated successfully" };
  } catch (error) {
    console.error("Error updating cache:", error);
    throw error;
  }
}