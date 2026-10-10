import { XBELParseError, parseXMLToJSON } from "../utils/xmlParser";
import { processXBELContent } from "../services/xbel-reload.service";
import { logger } from "../services/logger.service";

/**
 * Tamaño máximo aceptado para un archivo XBEL (10 MB).
 * Los XBEL de marcadores reales no pasan de unos pocos MB.
 */
const MAX_XBEL_SIZE = 10 * 1024 * 1024;

export interface XbelUploadInput {
  /** Contenido del archivo subido, como texto */
  content: string;
  /** Nombre original del archivo (solo informativo / para logs) */
  fileName?: string;
}

/**
 * Comprueba que el contenido subido parece un XBEL y que puede parsearse.
 * Lanza `Error` con un mensaje legible si el archivo no es válido.
 */
export async function validateXbel(content: string, fileName?: string) {
  const label = fileName ? `"${fileName}"` : "el archivo";

  // Quitar el BOM si el archivo se guardó como UTF-8 con BOM
  const cleaned = content.replace(/^\uFEFF/, "");

  if (cleaned.trim().length === 0) {
    throw new Error(`El archivo ${label} está vacío`);
  }

  // Acepta tanto <xbel> como <xbel:xbel> (exportaciones con prefijo de namespace)
  if (!/<(?:[A-Za-z0-9_.-]+:)?xbel[\s>]/i.test(cleaned)) {
    throw new Error(`El archivo ${label} no parece un XBEL (no contiene la etiqueta <xbel>)`);
  }

  // Validación estricta: si el XML está roto o no tiene raíz <xbel>, se rechaza
  // antes de tocar la caché de marcadores.
  let bookmarks: any[];
  try {
    bookmarks = await parseXMLToJSON(cleaned);
  } catch (error: any) {
    if (error instanceof XBELParseError) {
      throw new Error(`El archivo ${label} no es un XBEL válido: ${error.message}`);
    }
    throw new Error(`No se pudo interpretar el archivo ${label}: ${error?.message || "XML inválido"}`);
  }

  if (!Array.isArray(bookmarks)) {
    throw new Error(`El archivo ${label} no contiene una estructura de marcadores válida`);
  }

  return { cleaned, rootItems: bookmarks.length };
}

/**
 * Procesa un XBEL subido manualmente y actualiza los marcadores.
 * Comparte toda la lógica con la recarga desde Google Drive.
 */
export async function handleXbelUpload({ content, fileName }: XbelUploadInput) {
  try {
    const { cleaned, rootItems } = await validateXbel(content, fileName);

    logger.info(`XBEL subido manualmente (${rootItems} elementos raíz). Procesando marcadores...`);

    const result = await processXBELContent(cleaned);

    return {
      ...result,
      message: "XBEL subido y marcadores actualizados correctamente",
      rootItems
    };
  } catch (error) {
    logger.error("Error procesando el XBEL subido", error);
    throw error;
  }
}

export { MAX_XBEL_SIZE };
