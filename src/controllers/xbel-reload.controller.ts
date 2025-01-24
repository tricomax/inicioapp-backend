import { reloadFromXBEL } from "../services/xbel-reload.service";

export async function handleXBELReload() {
  try {
    const result = await reloadFromXBEL();
    console.log("\n=== Resumen de la Operación ===");
    console.log(`URLs totales: ${result.stats.totalUrls}`);
    console.log(`URLs procesadas: ${result.stats.processed}`);
    console.log(`URLs sin cambios: ${result.stats.unchanged}`);
    console.log("\nEstadísticas de Favicons:");
    console.log(`Total intentados: ${result.stats.iconStats.attempted}`);
    console.log(`Total encontrados: ${result.stats.iconStats.succeeded}`);
    console.log(`└─ Por favicon.ico: ${result.stats.iconStats.icoSucceeded}`);
    console.log(`└─ Por tag HTML: ${result.stats.iconStats.htmlSucceeded}`);
    console.log(`Tasa de éxito: ${(
      result.stats.iconStats.succeeded / 
      result.stats.iconStats.attempted * 100
    ).toFixed(2)}%\n`);
    
    return result;
  } catch (error) {
    console.error("Error handling XBEL reload:", error);
    throw error;
  }
}