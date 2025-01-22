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
    
    // Copiar icono predeterminado para marcadores
    const defaultBookmarkPath = path.join(FAVICON_DIR, DEFAULT_BOOKMARK_ICON);
    try {
      await fs.access(defaultBookmarkPath);
    } catch {
      await fs.copyFile(DEFAULT_BOOKMARK_SOURCE, defaultBookmarkPath);
      console.log('Default bookmark icon copied successfully');
    }
    
    // Copiar icono predeterminado para carpetas
    const defaultFolderPath = path.join(FAVICON_DIR, DEFAULT_FOLDER_ICON);
    try {
      await fs.access(defaultFolderPath);
    } catch {
      await fs.copyFile(DEFAULT_FOLDER_SOURCE, defaultFolderPath);
      console.log('Default folder icon copied successfully');
    }
  }

  static async downloadFavicon(url: string): Promise<string> {
    try {
      const domain = new URL(url).origin;
      const faviconUrl = `${domain}/favicon.ico`;
      
      // Usar TextEncoder y Bun.hash para generar el hash
      const textEncoder = new TextEncoder();
      const hash = Buffer.from(
        String(Bun.hash(textEncoder.encode(url)))
      ).toString('hex');
      
      const fileName = `${hash}.ico`;
      const filePath = path.join(FAVICON_DIR, fileName);

      // Verificar si el favicon ya existe
      try {
        await fs.access(filePath);
        return fileName; // Si existe, retornamos el nombre del archivo
      } catch {
        // Si no existe, lo descargamos
        const response = await fetch(faviconUrl);
        if (!response.ok) throw new Error('Favicon not found');
        
        // Escribir directamente el archivo usando Bun.write
        await Bun.write(filePath, response);
        return fileName;
      }
    } catch (error) {
      console.error(`Error downloading favicon for ${url}:`, error);
      return DEFAULT_BOOKMARK_ICON;
    }
  }

    static async cleanup(activeUrls: string[]) {
      const files = await fs.readdir(FAVICON_DIR);
      const textEncoder = new TextEncoder();
      // Crear un Set de hashes activos para búsqueda O(1)
      const activeHashes = new Set(
        activeUrls.map(url =>
          Buffer.from(
            String(Bun.hash(textEncoder.encode(url)))
          ).toString('hex')
        )
      );
  
      for (const file of files) {
        if (file === DEFAULT_BOOKMARK_ICON || file === DEFAULT_FOLDER_ICON) continue;
        const fileHash = file.replace('.ico', '');
        
        if (!activeHashes.has(fileHash)) {
          await fs.unlink(path.join(FAVICON_DIR, file));
        }
      }
    }
  }