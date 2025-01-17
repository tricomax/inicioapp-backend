import { promises as fs } from "fs";

const favoritesFile = "./favorites.json"; // Ruta al archivo de favoritos

export async function saveFavorites(favorites: any[]) {
  try {
    await fs.writeFile(favoritesFile, JSON.stringify(favorites, null, 2));
    console.log("Favorites saved successfully to:", favoritesFile);
  } catch (error) {
    console.error("Error saving favorites:", error);
    throw error; // Lanzar el error para que se maneje en la ruta
  }
}

export async function loadFavorites() {
  try {
    const data = await fs.readFile(favoritesFile, "utf-8");
    const favorites = JSON.parse(data);
    console.log("Favorites loaded successfully from:", favoritesFile);
    return favorites;
  } catch (error) {
    console.error("Error loading favorites:", error);
    return []; // Devolver un array vacío si hay un error (por ejemplo, si el archivo no existe)
  }
}