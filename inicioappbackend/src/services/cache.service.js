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

// src/services/logger.service.ts
class LoggerService {
  timers;
  ignorePaths = ["/favicons"];
  constructor() {
    this.timers = new Map;
  }
  time(label) {
    this.timers.set(label, Date.now());
  }
  timeEnd(label) {
    const start = this.timers.get(label);
    if (start) {
      const duration = Date.now() - start;
      this.info(`${label}: ${duration}ms`);
      this.timers.delete(label);
    }
  }
  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level}] ${message}`;
  }
  shouldIgnorePath(path) {
    return this.ignorePaths.some((ignorePath) => path.startsWith(ignorePath));
  }
  info(message) {
    console.log(this.formatMessage("INFO" /* INFO */, message));
  }
  warn(message) {
    console.warn(this.formatMessage("WARN" /* WARN */, message));
  }
  error(message, error) {
    let errorMessage = message;
    if (error) {
      errorMessage += `
${error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}`;
    }
    console.error(this.formatMessage("ERROR" /* ERROR */, errorMessage));
  }
  http(method, path, status, duration) {
    if (this.shouldIgnorePath(path)) {
      return;
    }
    const statusIndicator = status >= 400 ? `[${status}]` : "";
    const message = `${method} ${path}${statusIndicator}`;
    console.log(this.formatMessage("HTTP" /* HTTP */, message));
  }
}
var logger = new LoggerService;

// src/services/cache.service.ts
import { promises as fs } from "fs";
var BOOKMARKS_FILE = "./bookmarks.json";
var cachedBookmarks = null;
async function initializeCache() {
  try {
    await fs.access(BOOKMARKS_FILE);
    logger.info("Archivo de cach\xE9 de marcadores existe");
    return loadBookmarksFromCache();
  } catch (error) {
    if (error.code === "ENOENT") {
      logger.info("El archivo de cach\xE9 de marcadores no existe");
      return null;
    }
    throw error;
  }
}
async function saveBookmarksToCache(bookmarks) {
  try {
    await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
    cachedBookmarks = bookmarks;
    logger.info("Marcadores guardados en cach\xE9 exitosamente");
  } catch (error) {
    logger.error("Error al guardar marcadores en cach\xE9", error);
    throw error;
  }
}
async function loadBookmarksFromCache() {
  try {
    const data = await fs.readFile(BOOKMARKS_FILE, "utf-8");
    cachedBookmarks = JSON.parse(data);
    logger.info("Marcadores cargados desde cach\xE9 exitosamente");
    return cachedBookmarks;
  } catch (error) {
    logger.error("Error al cargar marcadores desde cach\xE9", error);
    return null;
  }
}
async function isCacheEmpty() {
  try {
    await fs.access(BOOKMARKS_FILE);
    const data = await fs.readFile(BOOKMARKS_FILE, "utf-8");
    const bookmarks = JSON.parse(data);
    return !bookmarks || bookmarks.length === 0;
  } catch {
    return true;
  }
}
initializeCache();
export {
  saveBookmarksToCache,
  loadBookmarksFromCache,
  isCacheEmpty,
  initializeCache,
  cachedBookmarks
};
