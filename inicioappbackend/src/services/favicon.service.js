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
import { join } from "path";
class LoggerService {
  logFile;
  errorFile;
  timers;
  constructor() {
    const today = new Date().toISOString().split("T")[0];
    this.logFile = join("logs", `${today}.log`);
    this.errorFile = join("logs", `${today}-error.log`);
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
  async writeToFile(filePath, message) {
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      const content = exists ? await file.text() : "";
      await Bun.write(filePath, content + message + `
`);
    } catch (error) {
      console.error(`Error writing to log file: ${error}`);
    }
  }
  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }
  async info(message) {
    const formattedMessage = this.formatMessage("INFO" /* INFO */, message);
    console.log(formattedMessage);
    await this.writeToFile(this.logFile, formattedMessage);
  }
  async warn(message) {
    const formattedMessage = this.formatMessage("WARN" /* WARN */, message);
    console.warn(formattedMessage);
    await this.writeToFile(this.logFile, formattedMessage);
  }
  async error(message, error) {
    let errorMessage = message;
    if (error) {
      errorMessage += `
Error details: ${error instanceof Error ? error.stack : JSON.stringify(error)}`;
    }
    const formattedMessage = this.formatMessage("ERROR" /* ERROR */, errorMessage);
    console.error(formattedMessage);
    await this.writeToFile(this.errorFile, formattedMessage);
    await this.writeToFile(this.logFile, formattedMessage);
  }
}
var logger = new LoggerService;

// src/services/favicon.service.ts
import { promises as fs } from "fs";
import path from "path";
var FAVICON_DIR = "./storage/favicons";
var DEFAULT_BOOKMARK_ICON = "default-icon.png";
var DEFAULT_FOLDER_ICON = "folder-icon.png";
var DEFAULT_BOOKMARK_SOURCE = "./src/assets/default-icon.png";
var DEFAULT_FOLDER_SOURCE = "./src/assets/folder-icon.png";
var FETCH_TIMEOUT = 5000;

class FaviconService {
  static stats = {
    attempted: 0,
    succeeded: 0,
    icoSucceeded: 0,
    htmlSucceeded: 0
  };
  static async init() {
    await fs.mkdir(FAVICON_DIR, { recursive: true });
    const defaultBookmarkPath = path.join(FAVICON_DIR, DEFAULT_BOOKMARK_ICON);
    try {
      await fs.access(defaultBookmarkPath);
    } catch {
      await fs.copyFile(DEFAULT_BOOKMARK_SOURCE, defaultBookmarkPath);
    }
    const defaultFolderPath = path.join(FAVICON_DIR, DEFAULT_FOLDER_ICON);
    try {
      await fs.access(defaultFolderPath);
    } catch {
      await fs.copyFile(DEFAULT_FOLDER_SOURCE, defaultFolderPath);
    }
    this.stats = {
      attempted: 0,
      succeeded: 0,
      icoSucceeded: 0,
      htmlSucceeded: 0
    };
  }
  static async isValidResponse(response) {
    try {
      if (!response.ok) {
        logger.warn(`Respuesta no v\xE1lida (status ${response.status})`);
        return false;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("image/")) {
        logger.warn(`Content-type no es imagen: ${contentType}`);
        return false;
      }
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) === 0) {
        logger.warn(`Content-length es 0`);
        return false;
      }
      return true;
    } catch (error) {
      logger.error(`Error validando respuesta`, error);
      return false;
    }
  }
  static async quickFetch(url) {
    const controller = new AbortController;
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      logger.info(`Intentando descargar: ${url}`);
      const response = await fetch(url, { signal: controller.signal });
      if (await this.isValidResponse(response)) {
        logger.info(`\u2705 Descarga exitosa: ${url}`);
        return response;
      }
      logger.warn(`\u274C Respuesta no v\xE1lida: ${url}`);
      return null;
    } catch (error) {
      logger.error(`\u274C Error descargando ${url}`, error);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  static async saveIconFile(url, extension, data) {
    const textEncoder = new TextEncoder;
    const hash = Buffer.from(String(Bun.hash(textEncoder.encode(url)))).toString("hex");
    const fileName = `${hash}.${extension}`;
    const filePath = path.join(FAVICON_DIR, fileName);
    const files = await fs.readdir(FAVICON_DIR);
    for (const file of files) {
      if (file.startsWith(hash + ".")) {
        await fs.unlink(path.join(FAVICON_DIR, file));
      }
    }
    if (data instanceof Response) {
      const arrayBuffer = await data.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    } else {
      const arrayBuffer = await data.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    }
    await fs.access(filePath);
    return `/favicons/${fileName}`;
  }
  static getStats() {
    return { ...this.stats };
  }
  static resetStats() {
    this.stats = {
      attempted: 0,
      succeeded: 0,
      icoSucceeded: 0,
      htmlSucceeded: 0
    };
  }
  static async saveIcon(url, iconResponse) {
    try {
      const contentType = iconResponse.headers.get("content-type");
      let extension = "ico";
      if (contentType) {
        switch (contentType.toLowerCase()) {
          case "image/png":
            extension = "png";
            break;
          case "image/jpeg":
          case "image/jpg":
            extension = "jpg";
            break;
          case "image/svg+xml":
            extension = "svg";
            break;
          case "image/webp":
            extension = "webp";
            break;
          case "image/x-icon":
          case "image/vnd.microsoft.icon":
            extension = "ico";
            break;
        }
      }
      return await this.saveIconFile(url, extension, iconResponse);
    } catch (error) {
      throw new Error(`Error guardando icono: ${error instanceof Error ? error.message : "error desconocido"}`);
    }
  }
  static async saveCustomIcon(url, iconData) {
    try {
      const extension = iconData.type.split("/")[1] || "ico";
      return await this.saveIconFile(url, extension, iconData);
    } catch (error) {
      throw new Error(`Error guardando icono: ${error instanceof Error ? error.message : "error desconocido"}`);
    }
  }
  static async downloadFavicon(url) {
    this.stats.attempted++;
    const domain = new URL(url).origin;
    try {
      logger.info(`Procesando URL: ${url}`);
      logger.info(`Dominio: ${domain}`);
      logger.info(`Intentando favicon.ico...`);
      const icoResponse = await this.quickFetch(`${domain}/favicon.ico`);
      if (icoResponse) {
        this.stats.succeeded++;
        this.stats.icoSucceeded++;
        return icoResponse;
      }
      logger.info(`Buscando en HTML...`);
      const pageResponse = await this.quickFetch(domain);
      if (pageResponse) {
        const html = await pageResponse.text();
        const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
        if (iconMatch && iconMatch[1]) {
          const iconUrl = new URL(iconMatch[1], domain).href;
          logger.info(`Encontrado link en HTML: ${iconUrl}`);
          const iconResponse = await this.quickFetch(iconUrl);
          if (iconResponse) {
            this.stats.succeeded++;
            this.stats.htmlSucceeded++;
            return iconResponse;
          }
        } else {
          logger.warn(`No se encontr\xF3 link de icono en el HTML`);
        }
      }
      logger.warn(`\u274C No se encontr\xF3 icono para ${url}`);
      return null;
    } catch (error) {
      logger.error(`Error procesando ${url}`, error);
      return null;
    }
  }
  static async cleanup(activeUrls) {
    const files = await fs.readdir(FAVICON_DIR);
    const textEncoder = new TextEncoder;
    const activeHashes = new Set(activeUrls.map((url) => Buffer.from(String(Bun.hash(textEncoder.encode(url)))).toString("hex")));
    let removedCount = 0;
    for (const file of files) {
      if (file === DEFAULT_BOOKMARK_ICON || file === DEFAULT_FOLDER_ICON)
        continue;
      const hash = file.split(".")[0];
      if (!activeHashes.has(hash)) {
        await fs.unlink(path.join(FAVICON_DIR, file));
        removedCount++;
      }
    }
  }
}
export {
  FaviconService
};
