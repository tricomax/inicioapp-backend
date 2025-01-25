import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger.service';

const FAVICON_DIR = './storage/favicons';
const DEFAULT_BOOKMARK_ICON = 'default-icon.png';
const DEFAULT_FOLDER_ICON = 'folder-icon.png';
const DEFAULT_BOOKMARK_SOURCE = './src/assets/default-icon.png';
const DEFAULT_FOLDER_SOURCE = './src/assets/folder-icon.png';
const FETCH_TIMEOUT = 5000; // 5 segundos timeout

export interface IconStats {
  attempted: number;
  succeeded: number;
  icoSucceeded: number;
  htmlSucceeded: number;
}

export class FaviconService {
  private static stats: IconStats = {
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

  private static async isValidResponse(response: Response): Promise<boolean> {
    try {
      // Verificar status
      if (!response.ok) {
        logger.warn(`Respuesta no válida (status ${response.status})`);
        return false;
      }

      // Verificar content-type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('image/')) {
        logger.warn(`Content-type no es imagen: ${contentType}`);
        return false;
      }

      // Si hay content-length, verificar que no sea 0
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) === 0) {
        logger.warn(`Content-length es 0`);
        return false;
      }

      // Si llegamos aquí, la respuesta parece válida
      return true;
    } catch (error) {
      logger.error(`Error validando respuesta`, error);
      return false;
    }
  }

  private static async quickFetch(url: string): Promise<Response | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      logger.info(`Intentando descargar: ${url}`);
      const response = await fetch(url, { signal: controller.signal });
      
      if (await this.isValidResponse(response)) {
        logger.info(`✅ Descarga exitosa: ${url}`);
        return response;
      }
      
      logger.warn(`❌ Respuesta no válida: ${url}`);
      return null;
    } catch (error) {
      logger.error(`❌ Error descargando ${url}`, error);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private static async saveIconFile(url: string, extension: string, data: Response | Blob | File): Promise<string> {
    const textEncoder = new TextEncoder();
    const hash = Buffer.from(
      String(Bun.hash(textEncoder.encode(url)))
    ).toString('hex');

    const fileName = `${hash}.${extension}`;
    const filePath = path.join(FAVICON_DIR, fileName);

    // Buscar y eliminar archivos antiguos con el mismo hash
    const files = await fs.readdir(FAVICON_DIR);
    for (const file of files) {
      if (file.startsWith(hash + '.')) {
        await fs.unlink(path.join(FAVICON_DIR, file));
      }
    }

    // Guardar nuevo archivo según el tipo de datos
    if (data instanceof Response) {
      const arrayBuffer = await data.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    } else {
      const arrayBuffer = await data.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    }

    // Verificar que el archivo se guardó correctamente
    await fs.access(filePath);

    return `/favicons/${fileName}`;
  }

  static getStats(): IconStats {
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

  static async saveIcon(url: string, iconResponse: Response): Promise<string> {
    try {
      const contentType = iconResponse.headers.get('content-type');
      let extension = 'ico';

      if (contentType) {
        switch (contentType.toLowerCase()) {
          case 'image/png':
            extension = 'png';
            break;
          case 'image/jpeg':
          case 'image/jpg':
            extension = 'jpg';
            break;
          case 'image/svg+xml':
            extension = 'svg';
            break;
          case 'image/webp':
            extension = 'webp';
            break;
          case 'image/x-icon':
          case 'image/vnd.microsoft.icon':
            extension = 'ico';
            break;
        }
      }

      return await this.saveIconFile(url, extension, iconResponse);

    } catch (error) {
      throw new Error(`Error guardando icono: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }
  }

  static async saveCustomIcon(url: string, iconData: File | Blob): Promise<string> {
    try {
      const extension = iconData.type.split('/')[1] || 'ico';
      return await this.saveIconFile(url, extension, iconData);
    } catch (error) {
      throw new Error(`Error guardando icono: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }
  }

  static async downloadFavicon(url: string): Promise<Response | null> {
    this.stats.attempted++;
    const domain = new URL(url).origin;

    try {
      logger.info(`Procesando URL: ${url}`);
      logger.info(`Dominio: ${domain}`);

      // 1. Primer intento: favicon.ico directo
      logger.info(`Intentando favicon.ico...`);
      const icoResponse = await this.quickFetch(`${domain}/favicon.ico`);
      if (icoResponse) {
        this.stats.succeeded++;
        this.stats.icoSucceeded++;
        return icoResponse;
      }

      // 2. Segundo intento: buscar en HTML
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
          logger.warn(`No se encontró link de icono en el HTML`);
        }
      }

      logger.warn(`❌ No se encontró icono para ${url}`);
      return null;
    } catch (error) {
      logger.error(`Error procesando ${url}`, error);
      return null;
    }
  }

  static async cleanup(activeUrls: string[]) {
    const files = await fs.readdir(FAVICON_DIR);
    const textEncoder = new TextEncoder();
    const activeHashes = new Set(
      activeUrls.map(url =>
        Buffer.from(
          String(Bun.hash(textEncoder.encode(url)))
        ).toString('hex')
      )
    );

    let removedCount = 0;
    for (const file of files) {
      if (file === DEFAULT_BOOKMARK_ICON || 
          file === DEFAULT_FOLDER_ICON) continue;

      const hash = file.split('.')[0];
      if (!activeHashes.has(hash)) {
        await fs.unlink(path.join(FAVICON_DIR, file));
        removedCount++;
      }
    }
  }
}