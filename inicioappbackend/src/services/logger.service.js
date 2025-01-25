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
export {
  logger
};
