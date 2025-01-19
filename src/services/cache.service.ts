import { promises as fs } from "fs";
import { getBookmarksData } from "./drive.service";
import { parseXMLToJSON } from "../utils/xmlParser";

const bookmarksFile = "./bookmarks.json";

// Variable global para almacenar los marcadores en memoria
export let cachedBookmarks: any = null;

export async function loadBookmarks() {
  try {
    // Intenta cargar desde el archivo local primero
    const localBookmarks = await loadBookmarksFromLocalFile();
    if (localBookmarks) {
      cachedBookmarks = localBookmarks;
      console.log("Bookmarks loaded from local file.");
      return;
    }

    // Si no hay copia local, obtiene los datos de Google Drive
    console.log("Getting bookmarks data from drive service...");
    const xmlData = await getBookmarksData();

    console.log("Parsing XML to JSON...");
    const jsonData = await parseXMLToJSON(xmlData);
    console.log("XML parsed to JSON successfully.");

    cachedBookmarks = jsonData;
    await saveBookmarksToLocalFile(jsonData);
  } catch (error) {
    console.error("Error loading bookmarks:", error);
    throw error;
  }
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