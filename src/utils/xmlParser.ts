import { parseStringPromise } from "xml2js";

/**
 * Error lanzado cuando el contenido recibido no es un XBEL interpretable.
 * Permite distinguir los problemas de formato (culpa del archivo subido)
 * de los errores internos del servidor.
 */
export class XBELParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XBELParseError";
  }
}

/**
 * Quita el prefijo de namespace de las claves generadas por xml2js.
 * Cubre XBEL de Firefox (`<xbel:xbel>`), de Python (xmlns:xbel) y de
 * cualquier otro exportador que use prefijos distintos.
 */
function stripNamespacePrefix(key: string): string {
  const separator = key.indexOf(":");
  return separator === -1 ? key : key.slice(separator + 1);
}

function normalizeKeys(data: any): any {
  if (Array.isArray(data)) {
    return data.map(normalizeKeys);
  }

  if (data && typeof data === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      const normalizedKey = key === "$" ? key : stripNamespacePrefix(key);
      result[normalizedKey] = normalizeKeys(value);
    }
    return result;
  }

  return data;
}

export async function parseXMLToJSON(xml: string) {
  let result: any;

  try {
    result = await parseStringPromise(xml);
  } catch (error: any) {
    throw new XBELParseError(error?.message || "El XML no se pudo parsear");
  }

  const normalized = normalizeKeys(result);
  const xbel = normalized?.xbel;

  if (!xbel) {
    throw new XBELParseError('No se encontró la etiqueta raíz <xbel>');
  }

  return transformBookmarks(xbel);
}

/**
 * Convierte un nodo XBEL (raíz, carpeta o subcarpeta) en la lista de elementos
 * de la aplicación.
 *
 * Un mismo nivel puede contener carpetas y marcadores mezclados, en cualquier
 * orden: se procesan todos los hijos y se conserva el orden original del archivo.
 */
function transformBookmarks(data: any): any[] {
  const items: any[] = [];

  const folders = Array.isArray(data?.folder) ? data.folder : [];
  const bookmarks = Array.isArray(data?.bookmark) ? data.bookmark : [];

  for (const folder of folders) {
    items.push({
      id: folder.$?.id,
      title: folder.title?.[0],
      type: "folder",
      children: transformBookmarks(folder),
    });
  }

  for (const bookmark of bookmarks) {
    items.push({
      id: bookmark.$?.id,
      title: bookmark.title?.[0],
      url: bookmark.$?.href,
      type: "bookmark",
    });
  }

  if (items.length === 0) {
    console.log("Unknown element type:", data);
  }

  return items;
}
