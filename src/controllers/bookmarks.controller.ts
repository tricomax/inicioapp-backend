import { getBookmarksData } from "../services/drive.service";
import { parseXMLToJSON } from "../utils/xmlParser";
import { promises as fs } from "fs";

const bookmarksFile = "./bookmarks.json"; // Ruta al archivo JSON local

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
    return null; // Devolver null si hay un error
  }
}

async function createBookmarksFileIfNotExists() {
  try {
    // Comprueba si el archivo existe
    await fs.access(bookmarksFile);
    console.log("Bookmarks file exists.");
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // El archivo no existe, así que lo creamos
      console.log("Bookmarks file does not exist. Creating...");
      await saveBookmarksToLocalFile([]); // Crea el archivo con un array vacío
      console.log("Bookmarks file created.");
    } else {
      console.error("Error accessing bookmarks file:", error);
      throw error;
    }
  }
}

export async function getBookmarks() {
  // Intentar crear el archivo bookmarks.json si no existe
  await createBookmarksFileIfNotExists();
  try {
    console.log("Getting bookmarks data from drive service...");
    const xmlData = await getBookmarksData(); // Obtiene el XML de Google Drive

    // Intentar parsear el XML a JSON
    let jsonData;
    try {
      console.log("Parsing XML to JSON...");
      jsonData = await parseXMLToJSON(xmlData);
      console.log("XML parsed to JSON successfully.");
    } catch (error) {
      console.error("Error parsing XML to JSON:", error);
      // Si hay un error al parsear el XML, intentar cargar la copia local
      console.log("Attempting to load bookmarks from local file...");
      const localBookmarks = await loadBookmarksFromLocalFile();
      if (localBookmarks) {
        return localBookmarks;
      } else {
        throw new Error(
          "Failed to parse XML and load bookmarks from local file."
        );
      }
    }

    // Si el parseo a JSON fue exitoso, guardar la copia local y devolver los datos
    console.log("Saving bookmarks to local file...");
    await saveBookmarksToLocalFile(jsonData);
    return jsonData;
  } catch (error) {
    console.error("Error in getBookmarks:", error);
    // En caso de un error al obtener datos de Google Drive, intentar cargar la copia local
    console.log("Attempting to load bookmarks from local file...");
    const localBookmarks = await loadBookmarksFromLocalFile();
    if (localBookmarks) {
      return localBookmarks;
    } else {
      throw new Error(
        "Failed to get bookmarks from Google Drive and local file."
      );
    }
  }
}