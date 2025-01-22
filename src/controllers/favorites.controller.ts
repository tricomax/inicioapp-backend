import { promises as fs } from "fs";
import { Favorite } from "../types/favorite.type";

const favoritesFile = "./favorites.json";
let favorites: Favorite[] = [];

export async function initFavorites() {
  try {
    await fs.access(favoritesFile);
    // Si el archivo existe, cargamos los favoritos en memoria
    favorites = JSON.parse(await fs.readFile(favoritesFile, "utf-8"));
    console.log("Favorites loaded from file:", favorites.length);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // Si el archivo no existe, lo creamos vacío
      await fs.writeFile(favoritesFile, JSON.stringify([], null, 2));
      console.log("Created empty favorites file");
    } else {
      console.error("Error initializing favorites:", error);
      throw error;
    }
  }
}

export async function getFavorites(): Promise<Favorite[]> {
  return favorites;
}

export async function addFavorite(favorite: Favorite): Promise<void> {
  if (!favorites.some(f => f.url === favorite.url)) {
    favorites.push(favorite);
    await saveFavorites();
  }
}

export async function removeFavorite(url: string): Promise<void> {
  favorites = favorites.filter(f => f.url !== url);
  await saveFavorites();
}

async function saveFavorites(): Promise<void> {
  try {
    await fs.writeFile(favoritesFile, JSON.stringify(favorites, null, 2));
    console.log("Favorites saved successfully");
  } catch (error) {
    console.error("Error saving favorites:", error);
    throw error;
  }
}