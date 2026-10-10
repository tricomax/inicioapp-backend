enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  HTTP = "HTTP"
}

class LoggerService {
  private timers: Map<string, number>;
  private readonly ignorePaths = ['/favicons'];

  constructor() {
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

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level}] ${message}`;
  }

  private shouldIgnorePath(path: string): boolean {
    return this.ignorePaths.some(ignorePath => path.startsWith(ignorePath));
  }

  info(message: string) {
    console.log(this.formatMessage(LogLevel.INFO, message));
  }

  warn(message: string) {
    console.warn(this.formatMessage(LogLevel.WARN, message));
  }

  error(message: string, error?: any) {
    let errorMessage = message;
    if (error) {
      errorMessage += `\n${error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}`;
    }
    console.error(this.formatMessage(LogLevel.ERROR, errorMessage));
  }

  http(method: string, path: string, status: number, duration: number) {
    // Ignorar peticiones a rutas específicas
    if (this.shouldIgnorePath(path)) {
      return;
    }

    // Simplificar el mensaje para peticiones HTTP
    const statusIndicator = status >= 400 ? `[${status}]` : '';
    const message = `${method} ${path}${statusIndicator}`;
    console.log(this.formatMessage(LogLevel.HTTP, message));
  }
}

export const logger = new LoggerService();