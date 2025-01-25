// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = import.meta.require;

// src/controllers/favorites.controller.ts
import { promises as fs } from "fs";
var favoritesFile = "./favorites.json";
var favorites = [];
async function initFavorites() {
  try {
    await fs.access(favoritesFile);
    favorites = JSON.parse(await fs.readFile(favoritesFile, "utf-8"));
    console.log("Favorites loaded from file:", favorites.length);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(favoritesFile, JSON.stringify([], null, 2));
      console.log("Created empty favorites file");
    } else {
      console.error("Error initializing favorites:", error);
      throw error;
    }
  }
}
async function getFavorites() {
  return favorites;
}
async function addFavorite(favorite) {
  if (!favorites.some((f) => f.url === favorite.url)) {
    favorites.push(favorite);
    await saveFavorites();
  }
}
async function removeFavorite(url) {
  favorites = favorites.filter((f) => f.url !== url);
  await saveFavorites();
}
async function updateFavoriteLocation(url, location) {
  console.log(`[Favorites] Actualizando location para URL ${url} a: ${location}`);
  const favorite = favorites.find((f) => f.url === url);
  if (favorite) {
    favorite.location = location;
    await saveFavorites();
    console.log(`[Favorites] Location actualizada correctamente`);
  } else {
    console.log(`[Favorites] No se encontr\xF3 favorito para la URL ${url}`);
  }
}
async function saveFavorites() {
  try {
    await fs.writeFile(favoritesFile, JSON.stringify(favorites, null, 2));
    console.log("Favorites saved successfully");
  } catch (error) {
    console.error("Error saving favorites:", error);
    throw error;
  }
}
export {
  updateFavoriteLocation,
  removeFavorite,
  initFavorites,
  getFavorites,
  addFavorite
};
