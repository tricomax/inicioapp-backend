import { google, type drive_v3 } from "googleapis";

const credentials = Bun.file(process.env.GOOGLE_CREDENTIALS_PATH!);

const auth = new google.auth.GoogleAuth({
  credentials: await credentials.json(),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

async function getFileContent(fileId: string): Promise<string> { // Se especifica el tipo de retorno como Promise<string>
  try {
    console.log(`Getting content of file with ID: ${fileId}`);
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "text" } // Forzar que la respuesta sea de tipo texto
    );
    console.log("File content fetched successfully.");
    return response.data as string; // Se devuelve la propiedad data como string
  } catch (error) {
    console.error("Error getting file content:", error);
    throw error;
  }
}

export async function findBookmarksFile(): Promise<string> { // Asegúrate de que la función devuelve una Promesa que resuelve a un string
  try {
    console.log("Finding bookmarks file...");
    const response = await drive.files.list({
      q: "name='bookmarks.xbel'",
      fields: "files(id, name)",
    });
    const files = response.data.files;
    if (files && files.length > 0) {
      console.log("Bookmarks file found:", files[0].id);
      return files[0].id!; // Devuelve el ID del archivo
    } else {
      console.error("Bookmarks file not found.");
      throw new Error("Bookmarks file not found");
    }
  } catch (error) {
    console.error("Error finding bookmarks file:", error);
    throw error;
  }
}

export async function getBookmarksData(): Promise<string> { // Se especifica el tipo de retorno como Promise<string>
  try {
    console.log("Getting bookmarks data...");
    const fileId = await findBookmarksFile(); // Obtiene el ID del archivo
    const fileContent = await getFileContent(fileId); // Obtiene el contenido del archivo usando el ID
    console.log("Bookmarks data fetched successfully.");
    return fileContent; // Devuelve el contenido del archivo
  } catch (error) {
    console.error("Error getting bookmarks data:", error);
    throw error;
  }
}