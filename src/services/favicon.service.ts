import { promises as fs } from 'fs';
import path from 'path';
import { addObsoleteBookmark } from '../controllers/obsoleteBookmarks.controller';

const FAVICON_DIR = './storage/favicons';
const DEFAULT_BOOKMARK_ICON = 'default-icon.png';
const DEFAULT_FOLDER_ICON = 'folder-icon.png';
const DEFAULT_BOOKMARK_SOURCE = './src/assets/default-icon.png';
const DEFAULT_FOLDER_SOURCE = './src/assets/folder-icon.png';
const CUSTOM_ICONS_FILE = path.join(FAVICON_DIR, 'custom_icons.json');

export class FaviconService {
  private static customIcons: Set<string>;

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

    // Inicializar conjunto de iconos personalizados
    try {
      const data = await fs.readFile(CUSTOM_ICONS_FILE, 'utf8');
      this.customIcons = new Set(JSON.parse(data));
    } catch {
      this.customIcons = new Set();
    }
  }

  private static async saveCustomIconsList() {
    await fs.writeFile(CUSTOM_ICONS_FILE, JSON.stringify(Array.from(this.customIcons)));
  }

  static async downloadFavicon(url: string): Promise<string> {
    try {
      const domain = new URL(url).origin;
      const textEncoder = new TextEncoder();
      const hash = Buffer.from(
        String(Bun.hash(textEncoder.encode(url)))
      ).toString('hex');

      // Si la URL tiene un icono personalizado, no buscar automáticamente
      if (this.customIcons.has(url)) {
        return `${hash}.ico`;
      }

      const fileName = `${hash}.ico`;
      const filePath = path.join(FAVICON_DIR, fileName);

      try {
        await fs.access(filePath);
        return fileName;
      } catch {
        // Intentar primero en el <head> de la página
        let foundFavicon = false;
        const response = await fetch(domain);
        if (response.ok) {
          const html = await response.text();
          // Try different patterns to find icons
          const patterns = [
            /<link[^>]*rel=["'][^"']*(?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
            /<link[^>]*rel=["'][^"']*apple-touch-icon["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
            /<link[^>]*rel=["'][^"']*favicon["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
            /<link[^>]*href=["']([^"']*favicon[^"']*)["'][^>]*>/gi,
            /<link[^>]*rel=["'][^"']*icon["'][^>]*href=["']([^"']+)["'][^>]*>/gi
          ];

          // Try each pattern until we find a valid icon
          for (const pattern of patterns) {
            const matches = html.matchAll(pattern);
            for (const match of matches) {
              if (match[1]) {
                let iconUrl = match[1];
                if (!iconUrl.startsWith('http')) {
                  iconUrl = new URL(iconUrl, domain).href;
                }
                try {
                  const iconResponse = await fetch(iconUrl);
                  if (iconResponse.ok && iconResponse.headers.get('content-length') !== '0') {
                    await Bun.write(filePath, iconResponse);
                    foundFavicon = true;
                    return fileName;
                  }
                } catch {
                  continue;
                }
              }
            }
          }
        }
        
        // Si no encontramos nada, intentar la ubicación clásica
        if (!foundFavicon) {
          try {
            const fallback = await fetch(`${domain}/favicon.ico`);
            if (fallback.ok && fallback.headers.get('content-length') !== '0') {
              await Bun.write(filePath, fallback);
              return fileName;
            }
          } catch {}
        }
        throw new Error('No favicon found');
      }
    } catch (error) {
      console.error(`Error downloading favicon for ${url}:`, error);
      if (error instanceof Error && 
          error.message === 'Unable to connect. Is the computer able to access the url?') {
        await addObsoleteBookmark({ url });
      }
      return DEFAULT_BOOKMARK_ICON;
    }
  }

  static async saveCustomFavicon(url: string, iconData: Blob): Promise<string> {
    try {
      const textEncoder = new TextEncoder();
      const hash = Buffer.from(
        String(Bun.hash(textEncoder.encode(url)))
      ).toString('hex');
      const fileName = `${hash}.ico`;
      const filePath = path.join(FAVICON_DIR, fileName);

      // Eliminar archivo existente si existe
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignorar si no existe
      }

      // Guardar nuevo icono
      await Bun.write(filePath, iconData);
      
      // Registrar como icono personalizado
      this.customIcons.add(url);
      await this.saveCustomIconsList();

      return fileName;
    } catch (error) {
      console.error(`Error saving custom favicon for ${url}:`, error);
      throw new Error('Failed to save custom favicon');
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
      if (file === DEFAULT_BOOKMARK_ICON || 
          file === DEFAULT_FOLDER_ICON || 
          file === 'custom_icons.json') continue;

      const fileHash = file.replace('.ico', '');
      if (!activeHashes.has(fileHash)) {
        await fs.unlink(path.join(FAVICON_DIR, file));
      }
    }
  }
}