import { reloadFromXBEL } from "../services/xbel-reload.service";

export async function handleXBELReload() {
  try {
    // El resumen de la operación y de los favicons lo registra el propio servicio.
    return await reloadFromXBEL();
  } catch (error) {
    console.error("Error handling XBEL reload:", error);
    throw error;
  }
}