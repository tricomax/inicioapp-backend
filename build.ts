import { $ } from "bun";
import path from "path";
import { mkdir, copyFile, readdir, access, unlink } from "fs/promises";

const TARGET_DIR = "inicioappbackend";
const SOURCE_DIR = ".";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectory(source: string, target: string) {
  try {
    await mkdir(target, { recursive: true });
    const entries = await readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, targetPath);
      } else {
        await copyFile(sourcePath, targetPath);
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function build() {
  try {
    console.log("🚀 Iniciando build personalizada...");

    // Crear directorio destino
    console.log(`\n📁 Creando directorio ${TARGET_DIR}...`);
    await mkdir(TARGET_DIR, { recursive: true });

    // Archivos requeridos en la raíz
    console.log("\n📄 Copiando archivos requeridos...");
    const requiredFiles = [
      ".env",
      "firebase-adminsdk.json",
      "google-credentials.json",
      "package.json",
      "README.md",
      "bun.lockb"
    ];

    for (const file of requiredFiles) {
      if (await fileExists(file)) {
        await copyFile(file, path.join(TARGET_DIR, file));
        console.log(`✅ Copiado: ${file}`);
      } else {
        console.error(`❌ Error: Archivo requerido no encontrado: ${file}`);
        process.exit(1);
      }
    }

    // Archivos opcionales en la raíz
    console.log("\n📄 Copiando archivos opcionales...");
    const optionalFiles = [
      "bookmarks.json",
      "favorites.json"
    ];

    for (const file of optionalFiles) {
      if (await fileExists(file)) {
        await copyFile(file, path.join(TARGET_DIR, file));
        console.log(`✅ Copiado: ${file}`);
      } else {
        console.log(`ℹ️ Archivo opcional no encontrado: ${file} (se creará en tiempo de ejecución)`);
      }
    }

    // Directorios opcionales
    console.log("\n📁 Copiando directorios...");
    const directories = [
      { path: "storage", required: false }
    ];
    
    for (const dir of directories) {
      const success = await copyDirectory(dir.path, path.join(TARGET_DIR, dir.path));
      if (success) {
        console.log(`✅ Copiado: ${dir.path}`);
      } else if (dir.required) {
        console.error(`❌ Error: No se pudo copiar el directorio requerido: ${dir.path}`);
        process.exit(1);
      } else {
        console.log(`ℹ️ Directorio opcional no encontrado: ${dir.path} (se creará en tiempo de ejecución)`);
        // Crear el directorio vacío para mantener la estructura
        await mkdir(path.join(TARGET_DIR, dir.path), { recursive: true });
      }
    }

    // Crear estructura de src y copiar assets
    console.log("\n📁 Preparando estructura de src...");
    await mkdir(path.join(TARGET_DIR, "src"), { recursive: true });
    
    if (await fileExists("src/assets")) {
      await copyDirectory("src/assets", path.join(TARGET_DIR, "src", "assets"));
      console.log("✅ Copiado: src/assets");
    } else {
      console.error("❌ Error: Directorio src/assets no encontrado");
      process.exit(1);
    }

    // Compilar TypeScript manteniendo la estructura de src
    console.log("\n🔨 Compilando archivos TypeScript...");
    
    // Compilar usando bun build para TypeScript
    await $`bun build ./src/**/*.ts --outdir ${TARGET_DIR} --target bun`;
    console.log("✅ Compilación TypeScript completada");
    
    console.log("\n✨ Build completada exitosamente!");
    console.log(`\nPuedes encontrar la build en la carpeta '${TARGET_DIR}'`);
    
  } catch (error) {
    console.error("\n❌ Error durante la build:", error);
    process.exit(1);
  }
}

// Ejecutar build
build();