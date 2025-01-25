import { join } from "path";

enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

class LoggerService {
  private logFile: string;
  private errorFile: string;
  private timers: Map<string, number>;

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    this.logFile = join("logs", `${today}.log`);
    this.errorFile = join("logs", `${today}-error.log`);
    this.timers = new Map();
  }

  time(label: string) {
    this.timers.set(label, Date.now());
  }

  timeEnd(label: string) {
    const start = this.timers.get(label);
    if (start) {
      const duration = Date.now() - start;
      this.info(`${label}: ${duration}ms`);
      this.timers.delete(label);
    }
  }

  private async writeToFile(filePath: string, message: string) {
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      const content = exists ? await file.text() : "";
      await Bun.write(filePath, content + message + "\n");
    } catch (error) {
      console.error(`Error writing to log file: ${error}`);
    }
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  async info(message: string) {
    const formattedMessage = this.formatMessage(LogLevel.INFO, message);
    console.log(formattedMessage);
    await this.writeToFile(this.logFile, formattedMessage);
  }

  async warn(message: string) {
    const formattedMessage = this.formatMessage(LogLevel.WARN, message);
    console.warn(formattedMessage);
    await this.writeToFile(this.logFile, formattedMessage);
  }

  async error(message: string, error?: any) {
    let errorMessage = message;
    if (error) {
      errorMessage += `\nError details: ${error instanceof Error ? error.stack : JSON.stringify(error)}`;
    }
    const formattedMessage = this.formatMessage(LogLevel.ERROR, errorMessage);
    console.error(formattedMessage);
    await this.writeToFile(this.errorFile, formattedMessage);
    await this.writeToFile(this.logFile, formattedMessage);
  }
}

export const logger = new LoggerService();