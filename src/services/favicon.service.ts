import { promises as fs } from 'fs';
import path from 'path';

const FAVICON_DIR = './storage/favicons';
const DEFAULT_BOOKMARK_ICON = 'default-icon.png';
const DEFAULT_FOLDER_ICON = 'folder-icon.png';
const DEFAULT_BOOKMARK_SOURCE = './src/assets/default-icon.png';
const DEFAULT_FOLDER_SOURCE = './src/assets/folder-icon.png';

export class FaviconService {
  static async init() {
    await fs.mkdir(FAVICON_DIR, { recursive: true });
    
    const defaultBookmarkPath = path.join(FAVICON_DIR, DEFAULT_BOOKMARK_ICON);
    try {
      await fs.access(defaultBookmarkPath);
    } catch {
      await fs.copyFile(DEFAULT_BOOKMARK_SOURCE, defaultBookmarkPath);
      console.log('Default bookmark icon copied successfully');
    }
    
    const defaultFolderPath = path.join(FAVICON_DIR, DEFAULT_FOLDER_ICON);
    try {
      await fs.access(defaultFolderPath);
    } catch {
      await fs.copyFile(DEFAULT_FOLDER_SOURCE, defaultFolderPath);
      console.log('Default folder icon copied successfully');
    }
  }

  private static async saveIconFile(url: string, extension: string, data: Response | Blob | File): Promise<string> {
    const textEncoder = new TextEncoder();
    const hash = Buffer.from(
      String(Bun.hash(textEncoder.encode(url)))
    ).toString('hex');

    const fileName = `${hash}.${extension}`;
    const filePath = path.join(FAVICON_DIR, fileName);
    console.log(`[Favicon] Nombre del archivo: ${fileName}`);

    // Buscar y eliminar archivos antiguos con el mismo hash
    const files = await fs.readdir(FAVICON_DIR);
    for (const file of files) {
      if (file.startsWith(hash + '.')) {
        await fs.unlink(path.join(FAVICON_DIR, file));
        console.log(`[Favicon] Eliminado archivo antiguo: ${file}`);
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

    console.log(`[Favicon] Archivo guardado: ${fileName}`);

    // Verificar que el archivo se guardó correctamente
    await fs.access(filePath);
    const stats = await fs.stat(filePath);
    console.log(`[Favicon] Verificado: archivo existe (${stats.size} bytes)`);

    return `/favicons/${fileName}`;
  }

  /**
   * Guarda un icono descargado y devuelve su ubicación
   */
  static async saveIcon(url: string, iconResponse: Response): Promise<string> {
    console.log(`[Favicon] Guardando icono descargado para URL: ${url}`);

    try {
      // Determinar extensión basada en el content-type
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
          default:
            console.log(`[Favicon] Tipo de contenido desconocido: ${contentType}, usando .ico`);
        }
      }

      const location = await this.saveIconFile(url, extension, iconResponse);
      console.log(`[Favicon] Location del icono: ${location}`);
      return location;

    } catch (error) {
      console.error(`[Favicon] Error guardando icono:`, error);
      throw new Error(`Error guardando icono: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }
  }

  /**
   * Guarda un icono subido manualmente y devuelve su ubicación
   */
  static async saveCustomIcon(url: string, iconData: File | Blob): Promise<string> {
    console.log(`[Favicon] Guardando icono personalizado para URL: ${url}`);
    console.log(`[Favicon] Tipo: ${iconData.type}, Tamaño: ${iconData.size} bytes`);

    try {
      // Usar la extensión del tipo MIME del archivo
      const extension = iconData.type.split('/')[1] || 'ico';
      console.log(`[Favicon] Usando extensión: ${extension}`);

      const location = await this.saveIconFile(url, extension, iconData);
      console.log(`[Favicon] Location del icono: ${location}`);
      return location;

    } catch (error) {
      console.error(`[Favicon] Error guardando icono:`, error);
      throw new Error(`Error guardando icono: ${error instanceof Error ? error.message : 'error desconocido'}`);
    }
  }

  /**
   * Eliminar archivos de iconos que ya no están en uso
   */
  static async cleanup(activeUrls: string[]) {
    console.log(`[Cleanup] Iniciando limpieza. URLs activas: ${activeUrls.length}`);
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
    console.log(`[Cleanup] Eliminados ${removedCount} iconos sin usar`);
  }
}